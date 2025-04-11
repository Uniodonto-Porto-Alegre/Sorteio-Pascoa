// Configurações
const FIREBASE_URL = "https://sorteio-pascoa-default-rtdb.firebaseio.com";
const ENDPOINT_USUARIOS = `${FIREBASE_URL}/usuarios.json`;
const FOTOS_LOCAIS = "Colaboradores/"; // Pasta local onde as imagens estão armazenadas
const ICONES_PASCOA = "images/"; // Pasta com os ícones de Páscoa
const NUMERO_FLOCOS = 40; // Quantidade de flocos a serem criados

// Máscara para CPF (jQuery)
$(document).ready(function(){
    $('#cpf').mask('000.000.000-00');
});

function preCarregarImagensPascoa() {
    for (let i = 1; i <= 9; i++) {
        const img = new Image();
        img.src = `${ICONES_PASCOA}Ativo ${i}.png`;
    }
}

// Função para criar efeito de flocos de Páscoa
function criarFlocosPascoa() {
    // Remove flocos anteriores se existirem
    document.querySelectorAll('.floco-pascoa').forEach(floco => floco.remove());
    
    // Cria novos flocos
    for (let i = 0; i < NUMERO_FLOCOS; i++) {
        const floco = document.createElement('img');
        const randomIcon = Math.floor(Math.random() * 9) + 1;
        floco.src = `${ICONES_PASCOA}Ativo ${randomIcon}.png`;
        floco.classList.add('floco-pascoa');
        
        // Configurações de posição e animação
        const size = Math.random() * 30 + 50; // Tamanho entre 20px e 50px
        const startPos = Math.random() * window.innerWidth;
        const animationDuration = Math.random() * 5 + 5; // Entre 5 e 10 segundos
        const delay = Math.random() * 5; // Atraso inicial
        
        floco.style.cssText = `
            position: fixed;
            top: -100px;
            left: ${startPos}px;
            width: ${size}px;
            height: ${size}px;
            z-index: 1000;
            pointer-events: none;
            animation: cair ${animationDuration}s linear ${delay}s infinite;
            transform: rotate(${Math.random() * 360}deg);
        `;
        
        document.body.appendChild(floco);
    }
}

// Adiciona a animação no CSS dinamicamente
const style = document.createElement('style');
style.innerHTML = `
    @keyframes cair {
        0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(${window.innerHeight + 100}px) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Função para parar os flocos
function pararFlocosPascoa() {
    document.querySelectorAll('.floco-pascoa').forEach(floco => {
        floco.style.animation = 'none';
        setTimeout(() => floco.remove(), 1000);
    });
}

// Elementos da interface
const identificacao = document.getElementById('identificacao');
const sorteio = document.getElementById('sorteio');
const resultadoFinal = document.getElementById('resultado-final');
const btnVerificar = document.getElementById('btn-verificar');
const btnSortear = document.getElementById('btn-sortear');
const nomeUsuario = document.getElementById('nome-usuario');
const nomeSorteado = document.getElementById('nome-sorteado');
const resultado = document.getElementById('resultado');
const fotoUsuario = document.getElementById('foto-usuario');
const fotoSorteado = document.getElementById('foto-sorteado');
const fotoUsuarioPlaceholder = document.getElementById('foto-usuario-placeholder');
const fotoSorteadoPlaceholder = document.getElementById('foto-sorteado-placeholder');

// Variáveis globais
let usuarioAtual = null;
let participantes = [];
let sorteados = [];

// Verificar CPF do usuário
btnVerificar.addEventListener('click', verificarUsuario);

async function verificarUsuario() {
    const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
    
    if (cpf.length !== 11) {
        alert('Por favor, digite um CPF válido.');
        return;
    }
    
    btnVerificar.innerHTML = '<span class="loading"></span> Verificando...';
    btnVerificar.disabled = true;
    
    try {
        // Busca todos os usuários
        const response = await fetch(ENDPOINT_USUARIOS);
        const usuarios = await response.json();
        
        // Encontra o usuário pelo CPF
        const usuarioEncontrado = Object.entries(usuarios || {}).find(
            ([key, user]) => user.cpf === cpf
        );
        
        if (usuarioEncontrado) {
            const [key, userData] = usuarioEncontrado;
            usuarioAtual = { key, ...userData };
            
            // Carrega a foto do usuário atual
            carregarFotoLocal(cpf, fotoUsuario, fotoUsuarioPlaceholder);
            
            // Verifica se já sorteou
            if (usuarioAtual.sorteado) {
                // Carrega a foto do amigo sorteado
                const amigo = Object.values(usuarios).find(u => u.nome === usuarioAtual.amigoSorteado);
                if (amigo) {
                    carregarFotoLocal(amigo.cpf, fotoSorteado, fotoSorteadoPlaceholder);
                }
                mostrarResultadoFinal(usuarioAtual.amigoSorteado);
            } else {
                // Carrega lista de participantes
                await carregarParticipantes(usuarios);
                mostrarTelaSorteio();
            }
        } else {
            alert('CPF não encontrado. Por favor, verifique se digitou corretamente.');
        }
    } catch (error) {
        console.error('Erro ao verificar usuário:', error);
        alert('Ocorreu um erro ao verificar seu CPF. Por favor, tente novamente.');
    } finally {
        btnVerificar.innerHTML = '<i class="fas fa-check me-2"></i>Verificar';
        btnVerificar.disabled = false;
    }
}

// Função para carregar foto localmente
function carregarFotoLocal(cpf, elementoImg, elementoPlaceholder) {
    const extensoes = ['.jpeg', '.jpg', '.png'];
    let fotoCarregada = false;
    
    // Tenta carregar a foto com cada extensão possível
    extensoes.forEach(ext => {
        const img = new Image();
        img.onload = function() {
            elementoImg.src = `${FOTOS_LOCAIS}${cpf}${ext}`;
            elementoImg.style.display = 'block';
            elementoPlaceholder.style.display = 'none';
            fotoCarregada = true;
        };
        img.src = `${FOTOS_LOCAIS}${cpf}${ext}`;
    });
    
    // Se após tentar todas as extensões a foto não carregar
    setTimeout(() => {
        if (!fotoCarregada) {
            elementoImg.style.display = 'none';
            elementoPlaceholder.style.display = 'flex';
        }
    }, 100);
}

async function carregarParticipantes(usuarios) {
    participantes = [];
    sorteados = [];
    
    // Filtra participantes que ainda não foram sorteados
    for (const [key, user] of Object.entries(usuarios)) {
        if (!user.sorteado && key !== usuarioAtual.key) {
            participantes.push({
                key: key,
                nome: user.nome,
                cpf: user.cpf
            });
        }
        
        if (user.amigoSorteado) {
            sorteados.push(user.amigoSorteado);
        }
    }
    
    // Remove o usuário atual da lista de participantes
    participantes = participantes.filter(p => p.key !== usuarioAtual.key);
}

function mostrarTelaSorteio() {
    identificacao.style.display = 'none';
    sorteio.style.display = 'block';
    nomeUsuario.textContent = usuarioAtual.nome;
    btnSortear.addEventListener('click', realizarSorteio);
}

// Modificação na função realizarSorteio para incluir o efeito
async function realizarSorteio() {
    if (participantes.length === 0) {
        alert('Não há mais participantes disponíveis para sorteio.');
        return;
    }
    
    btnSortear.innerHTML = '<span class="loading"></span> Sorteando...';
    btnSortear.disabled = true;
    resultado.style.display = 'none';
    
    // Mostra o overlay de carregamento
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingBar = document.getElementById('loadingBar');
    loadingOverlay.style.transform = 'translateY(0)';
    
    loadingBar.style.width = '0%';

    // Inicia a animação da barra de carregamento
    setTimeout(() => {
        loadingBar.style.width = '100%';
    }, 50); // Pequeno delay para garantir que a transição seja aplicada
       // Prepara o áudio
       const aplausosAudio = document.getElementById('aplausosAudio');
    try {
             // Configura o timer para tocar o áudio após 2 segundos
             const audioTimer = setTimeout(() => {
                aplausosAudio.play().catch(e => console.error("Erro ao reproduzir áudio:", e));
            }, 2000);
            
        // Efeito de suspense (2 segundos para coincidir com a barra)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Sorteia um participante
        const indiceSorteado = Math.floor(Math.random() * participantes.length);
        const amigoSorteado = participantes[indiceSorteado];
        
        criarFlocosPascoa();
        
        await fetch(`${FIREBASE_URL}/usuarios/${usuarioAtual.key}.json`, {
            method: 'PATCH',
            body: JSON.stringify({
                sorteado: true,
                amigoSorteado: amigoSorteado.nome,
                dataSorteio: new Date().toISOString()
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        carregarFotoLocal(amigoSorteado.cpf, fotoSorteado, fotoSorteadoPlaceholder);
        mostrarResultadoFinal(amigoSorteado.nome);
        
    } catch (error) {
        console.error('Erro ao realizar sorteio:', error);
        resultado.style.display = 'block';
        resultado.innerHTML = 'Ocorreu um erro ao realizar o sorteio. Por favor, tente novamente.';
        pararFlocosPascoa();
    } finally {

        // No try/catch, antes de esconder o overlay:
        loadingBar.classList.add('complete');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Espera a animação terminar
        loadingOverlay.style.transform = 'translateY(-100%)';
        loadingBar.classList.remove('complete');
    
        // Reseta a barra para próxima vez
        loadingBar.style.transition = 'none';
        // Força o reflow antes de reaplicar a transição
        void loadingBar.offsetWidth;
        loadingBar.style.transition = 'width 2s linear';
        
        btnSortear.innerHTML = '<i class="fas fa-random me-2"></i>Sortear';
        btnSortear.disabled = false;
    }
}
function mostrarResultadoFinal(nomeAmigo) {
    identificacao.style.display = 'none';
    sorteio.style.display = 'none';
    resultadoFinal.style.display = 'block';
    nomeSorteado.textContent = nomeAmigo;
    
    // Efeito de revelação
    setTimeout(() => {
        document.querySelector('.resultado-box').classList.add('animate__animated', 'animate__bounceIn');
    }, 100);
}