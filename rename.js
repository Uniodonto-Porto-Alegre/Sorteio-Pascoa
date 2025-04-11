const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Promisify funções do fs para usar async/await
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);

// Configurações
const SOURCE_DIR = './Colaboradores - Fotos Oficiais'; // Diretório contendo as subpastas
const DEST_DIR = './imagens_consolidadas'; // Diretório de destino
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

// Função para copiar imagens
async function copyImagesFromSubfolders() {
  try {
    // Criar diretório de destino se não existir
    if (!fs.existsSync(DEST_DIR)) {
      fs.mkdirSync(DEST_DIR, { recursive: true });
      console.log(`Diretório ${DEST_DIR} criado com sucesso.`);
    }

    // Ler diretório fonte
    const items = await readdir(SOURCE_DIR);

    for (const item of items) {
      const itemPath = path.join(SOURCE_DIR, item);
      const itemStats = await stat(itemPath);

      // Processar apenas subpastas
      if (itemStats.isDirectory()) {
        console.log(`Processando pasta: ${item}`);
        
        // Ler conteúdo da subpasta
        const subItems = await readdir(itemPath);

        for (const subItem of subItems) {
          const subItemPath = path.join(itemPath, subItem);
          const ext = path.extname(subItem).toLowerCase();

          // Verificar se é uma imagem
          if (IMAGE_EXTENSIONS.includes(ext)) {
            // Criar novo nome para evitar colisões
            const newName = `${subItem}`; // Adiciona nome da pasta como prefixo
            const destPath = path.join(DEST_DIR, newName);

            // Copiar arquivo
            await copyFile(subItemPath, destPath);
            console.log(`Copiado: ${subItem} -> ${newName}`);
          }
        }
      }
    }

    console.log('Processamento concluído com sucesso!');
    console.log(`Todas as imagens foram copiadas para ${DEST_DIR}`);
  } catch (error) {
    console.error('Ocorreu um erro:', error);
  }
}

// Executar a função
copyImagesFromSubfolders();