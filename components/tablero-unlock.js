import { cargarMazo } from "../js/loader.js";

class TableroUnlock extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.descartadas = []; // ← AQUÍ // 
    this.listaCartas = []; // (opcional, útil para recuperar) //

    this.zCounter = 1;

  }

  connectedCallback() {
    this.fondo = this.getAttribute("fondo") || "";
    this.render();
    this.inicializar();

    this.iconoDescarte = this.shadowRoot.querySelector("#iconoDescarte"); 
    this.panelDescarte = this.shadowRoot.querySelector("#panelDescarte"); 
    this.iconoDescarte.addEventListener("click", () => { 
        this.panelDescarte.style.display = 
            this.panelDescarte.style.display === "none" ? "block" : "none"; });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100dvh;
          position: relative;
          overflow: hidden;
          touch-action: none; 
          overscroll-behavior: none;
        }


        #bandeja {
          height: 120px;
          width: 100dvw;
          background: #1e1e1e;
          border-top: 2px solid #444;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          overflow-x: auto;
          padding: 8px;
        }

        #bandeja::-webkit-scrollbar {
          height: 8px;
        }
        #bandeja::-webkit-scrollbar-thumb {
          background: #555;
          border-radius: 4px;
        }

        /* Icono flotante de descarte */
      #iconoDescarte {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 18px;
        user-select: none;
        z-index: 1000;
      }

      /* Panel de descarte */
      #panelDescarte {
        position: absolute;
        top: 60px;
        right: 12px;
        width: 200px;
        max-height: 300px;
        background: #1e1e1e;
        border: 2px solid #444;
        border-radius: 8px;
        padding: 8px;
        display: none;
        overflow-y: auto;
        z-index: 1000;
      }
        #areaTablero {
          width: 100%;
          height: calc(100% - 120px);
          position: relative;
          overflow: hidden;
          background-color: #708c6e;

          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

      </style>

      <div id="areaTablero"></div>
      <div id="bandeja"></div>

      <div id="iconoDescarte">🗑️ 0</div>
      <div id="panelDescarte"></div>
    `;
    
    
        this.areaTablero = this.shadowRoot.querySelector("#areaTablero");
        this.bandeja = this.shadowRoot.querySelector("#bandeja");
        this.iconoDescarte = this.shadowRoot.querySelector("#iconoDescarte"); 
        this.panelDescarte = this.shadowRoot.querySelector("#panelDescarte");
    
    const area = this.areaTablero;
    // Si hay imagen de fondo, intentar cargarla 
    if (this.fondo) { 
      const img = new Image();
       img.src = this.fondo; 
       
       img.onload = () => { 
        area.style.backgroundImage = `url(${this.fondo})`;
       }; 
       img.onerror = () => { 
        area.style.backgroundImage = "none"; // fallback al color genérico 
       }; 
      } else { 
        // No hay imagen → usar color genérico 
        area.style.backgroundImage = "none"; 
      }
  }

  async inicializar() {
    const rutaMazo = this.getAttribute("mazo");
    const datos = await cargarMazo(rutaMazo);

    const base = rutaMazo.replace(/[^/]+$/, "");

    this.listaCartas = datos.cartas.map(c => ({ 
        numero: c.numero, 
        frente: base + c.frente, 
        dorso: base + c.dorso, 
        rotar: c.rotar || false 
    }));

    this.cargarMiniaturas(datos.cartas, base);
  }

  cargarMiniaturas(lista, base) {
  lista.forEach(carta => {
    const mini = document.createElement("carta-mini");

    mini.setAttribute("numero", carta.numero);
    mini.setAttribute("dorso", base + carta.dorso);

    mini.usada = false;

    mini.addEventListener("pointerdown", (e) => {
  mini.usada = true;
  mini.remove();

  this.crearCartaGrande(carta, base, e, true); // ← true = viene de bandeja
});


    this.bandeja.appendChild(mini);
  });
}

crearCartaGrande(carta, base, e, desdeBandeja = false) {
  const grande = document.createElement("carta-unlock");

  grande.setAttribute("numero", carta.numero);
  grande.setAttribute("frente", base + carta.frente);
  grande.setAttribute("dorso", base + carta.dorso);

  if (carta.rotar) {
    grande.setAttribute("rotar", "");
  }

  if (desdeBandeja) {
    // 📌 CENTRAR EN PANTALLA
    const cartaW = 150;
    const cartaH = 220;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    grande.style.left = (centerX - cartaW / 2) + "px";
    grande.style.top = (centerY - cartaH / 2) + "px";
  } else {
    // 📌 Posición normal (cuando arrastras desde el tablero)
    grande.style.left = e.clientX - 75 + "px";
    grande.style.top = e.clientY - 110 + "px";
  }

  this.areaTablero.appendChild(grande);

  // Traer al frente
  this.traerAlFrente(grande);
}


descartarCarta(cartaGrande) {
  const numero = cartaGrande.getAttribute("numero");
  const dorso = cartaGrande.getAttribute("dorso");

  const mini = document.createElement("carta-mini");
  mini.setAttribute("numero", numero);
  mini.setAttribute("dorso", dorso);

  mini.addEventListener("mousedown", (e) => {
    mini.remove();
    this.recuperarCarta(numero, e);
  });

  this.panelDescarte.appendChild(mini);
  this.descartadas.push(numero);

  cartaGrande.remove();
  this.actualizarIconoDescarte();
}

recuperarCarta(numero, e) {
  const carta = this.listaCartas.find(c => c.numero == numero);
  if (!carta) return;

  this.panelDescarte.style.display = "none";
  
  const grande = document.createElement("carta-unlock");

  grande.setAttribute("numero", carta.numero);
  grande.setAttribute("frente", carta.frente);
  grande.setAttribute("dorso", carta.dorso);

  if (carta.rotar) {
    grande.setAttribute("rotar", "");
  }

  grande.style.left = e.clientX - 75 + "px";
  grande.style.top = e.clientY - 110 + "px";

  this.areaTablero.appendChild(grande);

  this.descartadas = this.descartadas.filter(n => n != numero);
  this.actualizarIconoDescarte();
}

actualizarIconoDescarte() {
  this.iconoDescarte.textContent = `🗑️ ${this.descartadas.length}`;
}

traerAlFrente(carta) {
  this.zCounter++;
  carta.style.zIndex = this.zCounter;
}

}

customElements.define("tablero-unlock", TableroUnlock);
