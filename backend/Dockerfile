# 1. Usa a versão slim do Node.js (evita erros de compilação do sqlite3)
FROM node:18-slim

# 2. Cria a pasta onde o código vai ficar dentro do container
WORKDIR /app

# 3. Copia apenas os arquivos de dependência primeiro
COPY package*.json ./

# 4. Instala as dependências (gera a node_modules lá dentro)
RUN npm install

# 5. Copia o resto do código da sua API para dentro da caixa
COPY . .

# 6. Protege a pasta de dados do banco SQLite contra apagamento ao reiniciar
VOLUME ["/app/data"]

# 7. Libera a porta 3000
EXPOSE 3000

# 8. Comando para iniciar a API
CMD ["npm", "start"]