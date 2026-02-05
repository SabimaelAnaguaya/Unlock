class CartaUnlock extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.isFlipped = false;

    this.dragging = false;
    this.moved = false;
    this.startPos = { x: 0, y: 0 };
    this.offset = { x: 0, y: 0 };

    this.zoomed = false;

    this.currentAngle = 0;
    this.targetAngle = 0;
    this.isRotating = false;

  }

  connectedCallback() {
    this.numero = this.getAttribute("numero") || "";
    this.frente = this.getAttribute("dorso") || "";
    this.dorso = this.getAttribute("frente") || "";
    this.rotable = this.hasAttribute("rotar");

    this.render();
    this.setupEvents();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: absolute;
          display: inline-block;
          width: 127px; 
          aspect-ratio: 6 / 11;
          cursor: grab;
          user-select: none;
          touch-action: none;
          transition: transform 0.2s ease;

        }

        .carta {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.4s ease;
        }

        .carta.volteada {
          transform: rotateY(180deg);
        }

        img {
          width: 100%;
          height: 100%;
          position: absolute;
          backface-visibility: hidden;
          border-radius: 6px;
          -webkit-user-drag: none;
          user-drag: none;
        }

        .dorso {
          transform: rotateY(180deg);
        }

        /* Botones */
        .btn {
          position: absolute;
          width: 28px;
          height: 28px;
          background: rgba(0,0,0,0.6);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
          user-select: none;
          z-index: 10;
        }

        .btn:hover {
          background: rgba(0,0,0,0.8);
        }

        .zoom-btn {
          top: 4px;
          right: 4px;
        }

        .flip-btn {
          bottom: 4px;
          right: 4px;
        }

        /* Zoom */
        :host(.zoomed) {
          width: 227px; 
          z-index: 999;
        }

        .discard-btn {
          top: 4px;
          left: 4px;
        }
          .rotate-handle {
            position: absolute;
            bottom: -12px;
            right: -12px;
            width: 24px;
            height: 24px;
            background: rgba(0,0,0,0.7);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: grab;
            user-select: none;
            z-index: 20;
            font-size: 14px;

          }

          .rotate-handle:hover {
            background: rgba(0,0,0,0.9);
          }

          .btn, .rotate-handle { 
            opacity: 0; 
            transition: opacity 0.25s ease; 
          }

          :host(:hover) .btn,
          :host(:hover) .rotate-handle {
            opacity: 1;
          }

      </style>

      <div class="carta">
        <img class="frente" src="${this.frente}">
        <img class="dorso" src="${this.dorso}">
      </div>

      <div class="rotate-handle">⟳</div>
      <div class="btn zoom-btn">🔍</div>
      <div class="btn flip-btn">↺</div>
      <div class="btn discard-btn">🗑️</div>

    `;

    // Desactivar drag nativo
    this.shadowRoot.querySelectorAll("img").forEach(img => {
      img.ondragstart = () => false;
    });

    this.cardElement = this.shadowRoot.querySelector(".carta");
    this.zoomBtn = this.shadowRoot.querySelector(".zoom-btn");
    this.flipBtn = this.shadowRoot.querySelector(".flip-btn");
  }

  setupEvents() {
    // -------------------------
    // Botón de Zoom
    // -------------------------
    this.zoomBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.zoomed = !this.zoomed;
      this.classList.toggle("zoomed", this.zoomed);
    });

    // -------------------------
    // Botón de Voltear
    // -------------------------
    this.flipBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleFlip();
    });

    // -------------------------
    // Arrastre
    // -------------------------
    this.addEventListener("pointerdown", (e) => {
      if (e.target.classList.contains("btn")) return;

      this.setPointerCapture(e.pointerId);

      this.dragging = true;
      this.moved = false;
      this.style.cursor = "grabbing";

      const rect = this.getBoundingClientRect();
      this.offset.x = e.clientX - rect.left;
      this.offset.y = e.clientY - rect.top;

      const move = (ev) => {
        if (!this.dragging) return;
      
        this.style.left = ev.clientX - this.offset.x + "px";
        this.style.top = ev.clientY - this.offset.y + "px";
      };
    
      const up = () => {
        this.dragging = false;
        this.style.cursor = "grab";
      
        this.removeEventListener("pointermove", move);
        this.removeEventListener("pointerup", up);
        this.removeEventListener("pointercancel", up);
      };
    
      this.addEventListener("pointermove", move);
      this.addEventListener("pointerup", up);
      this.addEventListener("pointercancel", up);
    });

    
    
    // -------------------------
    // Descartar
    // -------------------------
    
    this.discardBtn = this.shadowRoot.querySelector(".discard-btn");
    
    this.discardBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      
      const tablero = document.querySelector("tablero-unlock");
      if (tablero) {
        tablero.descartarCarta(this);
      }
    });
    // Obtener el handle
this.rotateHandle = this.shadowRoot.querySelector(".rotate-handle");

// Variables internas
this.currentAngle = 0;
this.targetAngle = 0;
this.isRotating = false;

// Rotación con pointer events
this.rotateHandle.addEventListener("pointerdown", (e) => {
  e.stopPropagation();
  this.setPointerCapture(e.pointerId);
  this.isRotating = true;

  const rect = this.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
  const initialRotation = this.currentAngle;

  const move = (ev) => {
    const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * 180 / Math.PI;
    const delta = angle - startAngle;
    this.targetAngle = initialRotation + delta;
  };

  const up = () => {
    this.isRotating = false;
    this.removeEventListener("pointermove", move);
    this.removeEventListener("pointerup", up);
    this.removeEventListener("pointercancel", up);
  };

  this.addEventListener("pointermove", move);
  this.addEventListener("pointerup", up);
  this.addEventListener("pointercancel", up);
});

// Animación suave SIEMPRE
const animateRotation = () => {
  this.currentAngle += (this.targetAngle - this.currentAngle) * 0.25;
  this.style.transform = `rotate(${this.currentAngle}deg)`;
  requestAnimationFrame(animateRotation);
};

animateRotation();


  }

  toggleFlip() {
    this.isFlipped = !this.isFlipped;
    this.cardElement.classList.toggle("volteada", this.isFlipped);
  }




}

customElements.define("carta-unlock", CartaUnlock);
