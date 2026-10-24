# ♻️ EcoDescarte — TI Verde & ODS 12

[![Netlify Status](https://api.netlify.com/api/v1/badges/5c1a7428-xxxx-xxxx-xxxx-xxxxxxxxxxxx/deploy-status)](https://ecodescarte-ods12.netlify.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Projeto EcoDescarte** é uma aplicação web full-stack projetada para otimizar a logística reversa e facilitar o descarte correto de resíduos eletrónicos, alinhada diretamente ao **ODS 12 (Consumo e Produção Responsáveis)** da ONU.

---

## 🔗 Links do Projeto

-  **Aplicação Online (Netlify):** [EcoDescarte](https://ecodescarte-ods12.netlify.app/)
-  **Repositório GitHub:** [GitHub - EcoDescarte](https://github.com/lzCrossz/Projeto_EcoDescarte-ODS-12)

---

## 📌 Sobre o Projeto

O **EcoDescarte** atua como um sistema dinâmico de geolocalização e gestão de pontos de recolha de resíduos especiais (lixo eletrónico, pilhas, óleos, baterias). A plataforma permite que utilizadores e parceiros locais registem novos pontos de descarte e consultem locais ativos em tempo real com persistência completa de dados na nuvem.

---

## 🛠️ Arquitetura e Stack Tecnológica

O projeto foi construído utilizando tecnologias modernas de desenvolvimento web full-stack:

- **Front-End:** 
  - HTML5 Semântico
  - Tailwind CSS (para uma interface limpa, moderna e responsiva)
  - JavaScript (Vanilla / ES6+) para manipulação do DOM e lógica de negócio
- **Backend & Base de Dados:** 
  - Supabase (PostgreSQL na nuvem) para armazenamento relacional e operações dinâmicas
- **Hospedagem & Deploy Contínuo:** 
  - Netlify & GitHub (CI/CD automatizado)

---

## ⚙️ Funcionalidades (CRUD Completo)

A aplicação contempla todas as operações essenciais de persistência de dados:
1. **Create (Inserir):** Registo dinâmico de novos pontos de recolha diretamente pela interface.
2. **Read (Consultar):** Listagem em tempo real dos pontos de descarte cadastrados na base de dados do Supabase.
3. **Update (Atualizar):** Modificação de informações de pontos existentes.
4. **Delete (Excluir/Inativar):** Remoção lógica ou física de registos obsoletos.

---

## 📂 Estrutura de Pastas

```text
/
├── index.html       # Página principal da aplicação
├── assets/          # Imagens, ícones e recursos estáticos
├── js/              # Lógica de scripts, conexão com Supabase e manipulação de CRUD
└── README.md        # Documentação oficial do repositório
```
