class CartaMini extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const numero = this.getAttribute("numero");
    const dorso = this.getAttribute("dorso");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          cursor: grab;
          margin: -10px;
          user-select: none;
        }

        img {
          width: 60px;
          height: 90px;
          border-radius: 4px;
          -webkit-user-drag: none;
          user-drag: none;
        }

    
      </style>

      <img src="${dorso}">
    `;
  }
}

customElements.define("carta-mini", CartaMini);
