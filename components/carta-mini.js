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
          height: 40px;
          display: flex;
          border: 1px solid white;
          align-items: center;
          cursor: grab;
          user-select: none;
          padding: 0 8px;
          border-radius: 5px;
        }
          
          p{     
          color: white;
        }
    
      </style>

      <p>${numero}</p>
    `;
  }
}

customElements.define("carta-mini", CartaMini);
