# Sistema de Modais com Portal

## 📋 Visão Geral

Sistema moderno de modais usando **React Portals** e **Context API** que garante que todos os modais apareçam sempre no topo da aplicação, com gerenciamento automático de z-index e bloqueio de scroll.

## ✨ Funcionalidades

- ✅ **Portal**: Renderiza modais fora da hierarquia DOM, sempre no topo
- ✅ **z-index automático**: Modais empilhados automaticamente
- ✅ **Bloqueio de scroll**: Body fica fixo quando modal está aberto
- ✅ **Acessibilidade**: Fecha com ESC e click fora do modal
- ✅ **Responsivo**: Adapta-se a diferentes tamanhos de tela
- ✅ **Animações suaves**: Fade in e slide up
- ✅ **Múltiplos tamanhos**: small, medium, large, full
- ✅ **Scroll interno**: Scroll customizado apenas no conteúdo

## 📁 Estrutura de Arquivos

```
escola/src/
├── components/
│   └── ModalBase.jsx          # Componente base do modal
├── context/
│   └── ModalContext.jsx       # Context para gerenciar z-index
├── css/
│   └── ModalBase.css          # Estilos do modal
└── pages/
    └── TurmasPage.jsx         # Exemplo de uso
```

## 🚀 Como Usar

### 1. Importar o hook e componente

```jsx
import { useModal } from "../context/ModalContext";
import ModalBase from "../components/ModalBase";
```

### 2. Configurar no componente

```jsx
const MeuComponente = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { openModal, closeModal, getZIndex } = useModal();
  const modalId = "meu-modal-unico"; // ID único para este modal

  // Registra o modal quando abre
  useEffect(() => {
    if (isModalOpen) {
      openModal(modalId);
    }
    return () => closeModal(modalId);
  }, [isModalOpen]);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>Abrir Modal</button>

      <ModalBase
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Título do Modal"
        size="medium"
        zIndex={getZIndex(modalId)}
      >
        <p>Conteúdo do modal aqui...</p>
      </ModalBase>
    </>
  );
};
```

## 🎨 Tamanhos Disponíveis

| Tamanho  | Max Width | Uso Recomendado                 |
| -------- | --------- | ------------------------------- |
| `small`  | 400px     | Confirmações, alertas simples   |
| `medium` | 600px     | Formulários pequenos, detalhes  |
| `large`  | 900px     | Formulários complexos, listas   |
| `full`   | 1200px    | Tabelas, visualizações extensas |

## ⚙️ Props do ModalBase

| Prop                  | Tipo     | Default  | Descrição                      |
| --------------------- | -------- | -------- | ------------------------------ |
| `isOpen`              | boolean  | required | Controla visibilidade do modal |
| `onClose`             | function | required | Callback ao fechar             |
| `title`               | string   | -        | Título exibido no header       |
| `size`                | string   | 'medium' | Tamanho do modal               |
| `zIndex`              | number   | 1000     | z-index base do modal          |
| `showCloseButton`     | boolean  | true     | Exibe botão X de fechar        |
| `closeOnOverlayClick` | boolean  | true     | Fecha ao clicar fora           |
| `closeOnEscape`       | boolean  | true     | Fecha ao pressionar ESC        |

## 📱 Comportamento Responsivo

- **Desktop**: Modal centralizado com padding lateral
- **Tablet**: Modal ocupa mais espaço horizontal
- **Mobile**: Modal em tela cheia com cantos arredondados no topo

## 🔄 Modais Aninhados

O sistema suporta múltiplos modais abertos simultaneamente:

```jsx
// Modal Pai
<ModalBase isOpen={modal1Open} zIndex={getZIndex('modal-1')} ...>
  <button onClick={() => setModal2Open(true)}>Abrir Outro Modal</button>
</ModalBase>

// Modal Filho (será renderizado por cima)
<ModalBase isOpen={modal2Open} zIndex={getZIndex('modal-2')} ...>
  <p>Este modal aparece por cima do primeiro!</p>
</ModalBase>
```

O z-index é calculado automaticamente: `1000, 1010, 1020, ...`

## 🎯 Exemplo Completo

Veja a implementação completa em:

- **TurmaModal**: Modal de detalhes de turma
- **AlunosModal**: Modal de lista de alunos

Ambos em `src/pages/TurmasPage.jsx`

## 🐛 Troubleshooting

### Modal não aparece no topo

- Verifique se o `#modal-root` existe no HTML
- Confirme que o `ModalProvider` está envolvendo a aplicação

### Scroll não está bloqueado

- O ModalBase gerencia isso automaticamente
- Verifique se há múltiplos modais usando gerenciamento manual de overflow

### z-index não funciona

- Use sempre `getZIndex(modalId)` do hook
- Certifique-se que cada modal tem um ID único
- Registre o modal com `openModal(modalId)` ao abrir

## 🔧 Customização

### Alterar animações

Edite `src/css/ModalBase.css`:

```css
@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(50px); /* Mude aqui */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Adicionar novos tamanhos

```css
.modal-base-xlarge {
  width: 100%;
  max-width: 1400px;
}
```

## 📚 Próximos Passos

Para migrar outros modais:

1. Importe `ModalBase` e `useModal`
2. Remova o código de overlay/container manual
3. Envolva o conteúdo com `<ModalBase>`
4. Adicione o registro do modal com `useEffect`
5. Use `getZIndex(modalId)` para o z-index

**Dica**: Comece pelos modais mais simples e vá progredindo para os mais complexos.
