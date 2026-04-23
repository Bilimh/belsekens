// latexRenderer.js

export function isKatexReady() {
    return typeof window !== "undefined"
      && typeof window.katex !== "undefined"
      && typeof window.renderMathInElement !== "undefined";
  }
  
  export function renderLatexInElement(element) {
    if (!element || !isKatexReady()) return;
  
    try {
      window.renderMathInElement(element, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false,
        strict: "ignore",
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
        ignoredClasses: [
          "latex-source-editing",
          "graph-modal",
          "graph-modal-body",
          "graph-form-group"
        ]
      });
    } catch (error) {
      console.error("Erreur rendu LaTeX :", error);
    }
  }
  
  export function stripKatexArtifacts(element) {
    if (!element) return;
  
    const katexNodes = element.querySelectorAll(".katex, .katex-display, .katex-error");
    katexNodes.forEach(node => {
      const parent = node.parentNode;
      if (!parent) return;
  
      if (parent.classList && parent.classList.contains("katex")) return;
    });
  }
  
  export function renderLatexInContainer(container) {
    if (!container) return;
  
    const latexTargets = container.querySelectorAll(".latex-enabled");
    latexTargets.forEach(target => {
      renderLatexInElement(target);
    });
  }