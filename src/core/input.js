export class Input {
  constructor(canvas, onSkill) {
    this.keys = new Set();
    this.pointer = null;
    this.vector = { x: 0, y: 0 };
    this.active = false;
    this.canvas = canvas;
    window.addEventListener("keydown", (e) => {
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        ) &&
        this.active
      )
        e.preventDefault();
      this.keys.add(e.code);
      if (!e.repeat && this.active) {
        if (e.code === "Space") onSkill();
      }
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.clear());
    canvas.addEventListener("pointerdown", (e) => {
      if (!this.active || this.pointer) return;
      canvas.setPointerCapture(e.pointerId);
      this.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
      this.vector = { x: 0, y: 0 };
    });
    canvas.addEventListener("pointermove", (e) => {
      if (this.pointer?.id !== e.pointerId) return;
      const x = e.clientX - this.pointer.x,
        y = e.clientY - this.pointer.y;
      const d = Math.hypot(x, y),
        limit = 55;
      this.vector = { x: x / Math.max(limit, d), y: y / Math.max(limit, d) };
    });
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
      canvas.addEventListener(event, (e) => {
        if (this.pointer?.id === e.pointerId) {
          this.pointer = null;
          this.vector = { x: 0, y: 0 };
        }
      });
  }
  get() {
    if (!this.active) return { x: 0, y: 0 };
    return {
      x:
        Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
        Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft")) +
        this.vector.x,
      y:
        Number(this.keys.has("KeyS") || this.keys.has("ArrowDown")) -
        Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")) +
        this.vector.y,
    };
  }
  clear() {
    this.keys.clear();
    this.pointer = null;
    this.vector = { x: 0, y: 0 };
  }
}
