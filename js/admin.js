// Configurações
const FIREBASE_URL = "https://sorteio-pascoa-default-rtdb.firebaseio.com";
const ENDPOINT_USUARIOS = `${FIREBASE_URL}/usuarios.json`;

// Elementos da interface
const formUsuario = document.getElementById('form-usuario');
const listaUsuarios = document.getElementById('lista-usuarios');
const btnResetSorteio = document.getElementById('btn-reset-sorteio');
const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
const confirmAction = document.getElementById('confirmAction');
const modalBody = document.getElementById('modalBody');
const modalTitle = document.getElementById('modalTitle');

// Variáveis globais
let acaoConfirmacao = null;
let usuarioSelecionado = null;

// Máscara para CPF
$(document).ready(function(){
    $('#cpf').mask('000.000.000-00');
    
    // Carrega usuários ao iniciar
    carregarUsuarios();
});

// Event Listeners
formUsuario.addEventListener('submit', cadastrarUsuario);
btnResetSorteio.addEventListener('click', confirmarResetSorteio);
confirmAction.addEventListener('click', executarAcaoConfirmada);

// Função para carregar usuários
async function carregarUsuarios() {
    try {
        const response = await fetch(ENDPOINT_USUARIOS);
        const usuarios = await response.json();
        
        listaUsuarios.innerHTML = '';

        if (usuarios) {
            // Converter objeto em array e ordenar alfabeticamente
            const usuariosOrdenados = Object.entries(usuarios)
                .map(([key, usuario]) => ({ key, ...usuario }))
                .sort((a, b) => a.nome.localeCompare(b.nome));
            
            // Preencher a tabela com os usuários ordenados
            usuariosOrdenados.forEach(({ key, ...usuario }) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${usuario.nome}</td>
                    <td>${formatarCPF(usuario.cpf)}</td>
                    <td>
                        <span class="status-badge ${usuario.sorteado ? 'bg-sorteado' : 'bg-pendente'}">
                            ${usuario.sorteado ? 'Sorteou' : 'Não Sorteou'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-danger btn-excluir" data-id="${key}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                listaUsuarios.appendChild(tr);
            });
            
            // Adiciona eventos aos botões de excluir
            document.querySelectorAll('.btn-excluir').forEach(btn => {
                btn.addEventListener('click', function() {
                    const userId = this.getAttribute('data-id');
                    confirmarExclusaoUsuario(userId);
                });
            });
        } else {
            listaUsuarios.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum usuário cadastrado</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        alert('Erro ao carregar lista de usuários');
    }
}
// Função para cadastrar novo usuário
async function cadastrarUsuario(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
    
    if (!nome || cpf.length !== 11) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }
    
    const btnSubmit = formUsuario.querySelector('button[type="submit"]');
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
    btnSubmit.disabled = true;
    
    try {
        // Verifica se CPF já existe
        const usuarios = await (await fetch(ENDPOINT_USUARIOS)).json();
        const cpfExistente = usuarios && Object.values(usuarios).some(u => u.cpf === cpf);
        
        if (cpfExistente) {
            throw new Error('CPF já cadastrado no sistema.');
        }
        
        // Cria novo usuário
        const novoUsuario = {
            nome,
            cpf,
            sorteado: false,
            amigoSorteado: null,
            dataSorteio: null
        };
        
        const response = await fetch(ENDPOINT_USUARIOS, {
            method: 'POST',
            body: JSON.stringify(novoUsuario),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            // Limpa o formulário
            formUsuario.reset();
            // Recarrega a lista
            await carregarUsuarios();
        } else {
            throw new Error('Erro ao salvar usuário.');
        }
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        alert(error.message || 'Erro ao cadastrar usuário.');
    } finally {
        btnSubmit.innerHTML = '<i class="fas fa-save me-2"></i>Salvar';
        btnSubmit.disabled = false;
    }
}

// Função para confirmar exclusão de usuário
function confirmarExclusaoUsuario(userId) {
    usuarioSelecionado = userId;
    acaoConfirmacao = 'excluir';
    
    modalTitle.textContent = 'Confirmar Exclusão';
    modalBody.textContent = 'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.';
    
    confirmModal.show();
}

// Função para confirmar reset do sorteio
function confirmarResetSorteio() {
    usuarioSelecionado = null;
    acaoConfirmacao = 'reset';
    
    modalTitle.textContent = 'Resetar Sorteio';
    modalBody.textContent = 'Tem certeza que deseja resetar todos os sorteios? Todos os usuários voltarão ao status "Pendente" e os amigos sorteados serão limpos.';
    
    confirmModal.show();
}

// Função para executar ação confirmada
async function executarAcaoConfirmada() {
    confirmModal.hide();
    
    try {
        if (acaoConfirmacao === 'excluir') {
            await excluirUsuario(usuarioSelecionado);
        } else if (acaoConfirmacao === 'reset') {
            await resetarSorteio();
        }
    } catch (error) {
        console.error('Erro ao executar ação:', error);
        alert('Erro ao executar ação.');
    }
}

// Função para excluir usuário
async function excluirUsuario(userId) {
    try {
        const response = await fetch(`${FIREBASE_URL}/usuarios/${userId}.json`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await carregarUsuarios();
            alert('Usuário excluído com sucesso!');
        } else {
            throw new Error('Erro ao excluir usuário.');
        }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        throw error;
    }
}

// Função para resetar o sorteio
async function resetarSorteio() {
    try {
        // Busca todos os usuários
        const response = await fetch(ENDPOINT_USUARIOS);
        const usuarios = await response.json();
        
        if (!usuarios) return;
        
        // Atualiza cada usuário
        const updates = Object.keys(usuarios).map(key => {
            return fetch(`${FIREBASE_URL}/usuarios/${key}.json`, {
                method: 'PATCH',
                body: JSON.stringify({
                    sorteado: false,
                    amigoSorteado: null,
                    dataSorteio: null
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        });
        
        // Executa todas as atualizações
        await Promise.all(updates);
        
        // Recarrega a lista
        await carregarUsuarios();
        alert('Sorteio resetado com sucesso! Todos os usuários estão como "Pendente".');
    } catch (error) {
        console.error('Erro ao resetar sorteio:', error);
        throw error;
    }
}

// Função auxiliar para formatar CPF
function formatarCPF(cpf) {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}