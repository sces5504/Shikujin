const SECRET = "wwssadadba";
export class SecretCode {
  constructor() {
    this.buffer = "";
  }
  feed(e) {
    if (
      e.repeat ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.target?.closest?.("input,textarea,select,[contenteditable='true']")
    )
      return false;
    const key = e.key.toLowerCase();
    if (key === "enter") {
      const ok = this.buffer === SECRET;
      this.buffer = "";
      return ok;
    }
    if (key.length !== 1) return false;
    this.buffer = (this.buffer + key).slice(-SECRET.length);
    return false;
  }
}
