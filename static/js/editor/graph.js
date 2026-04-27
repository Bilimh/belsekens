// graph.js - Version corrigée (uniquement les 2 problèmes)

import { createBlockType } from "./baseBlock.js";
import { updateBlockContent } from "./editorState.js";

const defaultGraphContent = {
  mode: "data",
  chartType: "line",
  chartTitle: "Mon graphique",
  labels: ["A", "B", "C"],
  datasets: [
    {
      label: "Série 1",
      values: [12, 19, 7]
    }
  ],
  functionExpr: "sin(x)",
  xMin: -10,
  xMax: 10,
  step: 0.1,
  gridStepX: 1,
  gridStepY: 1
};

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeGraphContent(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return {
      ...cloneDeep(defaultGraphContent),
      ...raw,
      datasets: Array.isArray(raw.datasets) && raw.datasets.length
        ? raw.datasets.map(ds => ({
            label: ds.label || "Série",
            values: Array.isArray(ds.values) ? ds.values : []
          }))
        : cloneDeep(defaultGraphContent.datasets)
    };
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return normalizeGraphContent(parsed);
    } catch {
      return cloneDeep(defaultGraphContent);
    }
  }

  return cloneDeep(defaultGraphContent);
}

const graphConfig = {
  defaultTitle: "Graphique",
  defaultContent: defaultGraphContent,

  defaultWidth: 760,
  defaultHeight: 460,
  defaultLeft: 40,
  defaultTop: 40,

  icon: "fas fa-chart-line",
  iconColor: "#fd7e14",
  className: "graph-block",
  autoStack: true,

  fields: [],

  customHtml: (data) => {
    const content = normalizeGraphContent(data.content);

    return `
      <div class="graph-block-container">
        <div class="graph-header">
          <button class="btn-open-graph-modal" title="Configurer le graphique" type="button">
            <i class="fas fa-sliders-h"></i> Configurer
          </button>
        </div>

        <div class="graph-canvas-wrapper">
          <canvas class="graph-canvas"></canvas>
        </div>

        <!-- ✅ Modal corrigé : plein écran avec blur -->
        <div class="graph-modal-overlay" style="display:none;">
          <div class="graph-modal">
            <div class="graph-modal-header">
              <h3>Configurer le graphique</h3>
              <button class="btn-close-graph-modal" title="Fermer" type="button">
                <i class="fas fa-times"></i>
              </button>
            </div>

            <div class="graph-modal-body">
              <div class="graph-form-grid">
                <div class="graph-form-group">
                  <label>Mode</label>
                  <select class="graph-mode-input">
                    <option value="data" ${content.mode === "data" ? "selected" : ""}>Données</option>
                    <option value="function" ${content.mode === "function" ? "selected" : ""}>Fonction mathématique</option>
                  </select>
                </div>

                <div class="graph-form-group">
                  <label>Type de graphique</label>
                  <select class="graph-type-input">
                    <option value="bar" ${content.chartType === "bar" ? "selected" : ""}>Barres</option>
                    <option value="line" ${content.chartType === "line" ? "selected" : ""}>Courbe</option>
                    <option value="pie" ${content.chartType === "pie" ? "selected" : ""}>Camembert</option>
                    <option value="doughnut" ${content.chartType === "doughnut" ? "selected" : ""}>Anneau</option>
                    <option value="radar" ${content.chartType === "radar" ? "selected" : ""}>Radar</option>
                    <option value="polarArea" ${content.chartType === "polarArea" ? "selected" : ""}>Aire polaire</option>
                  </select>
                </div>
              </div>

              <div class="graph-form-group">
                <label>Titre</label>
                <input type="text" class="graph-title-input" value="${escapeHtml(content.chartTitle || "")}">
              </div>

              <div class="graph-section section-data" style="${content.mode === "data" ? "" : "display:none;"}">
                <div class="graph-form-group">
                  <label>Étiquettes (une par ligne)</label>
                  <textarea class="graph-labels-input" rows="5">${(content.labels || []).join("\n")}</textarea>
                </div>

                <div class="graph-series-builder">
                  <div class="graph-series-header">
                    <label>Séries</label>
                    <button class="btn-add-series" type="button">
                      <i class="fas fa-plus"></i> Ajouter une série
                    </button>
                  </div>

                  <div class="graph-series-list"></div>
                </div>
              </div>

              <div class="graph-section section-function" style="${content.mode === "function" ? "" : "display:none;"}">
                <div class="graph-form-group">
                  <label>Expression</label>
                  <input type="text" class="graph-function-input" value="${escapeHtml(content.functionExpr || "sin(x)")}">
                </div>

                <div class="graph-form-grid">
                  <div class="graph-form-group">
                    <label>x min</label>
                    <input type="number" step="any" class="graph-xmin-input" value="${content.xMin}">
                  </div>

                  <div class="graph-form-group">
                    <label>x max</label>
                    <input type="number" step="any" class="graph-xmax-input" value="${content.xMax}">
                  </div>

                  <div class="graph-form-group">
                    <label>Pas de calcul</label>
                    <input type="number" step="any" class="graph-step-input" value="${content.step}">
                  </div>
                </div>

                <div class="graph-help-text">
                  Exemples : sin(x), cos(x), x^2 + 3*x - 1, ln(x), sqrt(x), exp(x)
                </div>
              </div>

              <div class="graph-form-grid">
                <div class="graph-form-group">
                  <label>Pas grille X</label>
                  <input type="number" step="any" class="graph-gridx-input" value="${content.gridStepX}">
                </div>

                <div class="graph-form-group">
                  <label>Pas grille Y</label>
                  <input type="number" step="any" class="graph-gridy-input" value="${content.gridStepY}">
                </div>
              </div>
            </div>

            <div class="graph-modal-footer">
              <button class="btn-cancel-graph" type="button">Annuler</button>
              <button class="btn-save-graph" type="button">Enregistrer</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ✅ CSS corrigé : modal plein écran avec blur
  customCSS: `
    .graph-block-container {
      width: 100%;
      height: 100%;
      padding: 8px;
      background: transparent;
      position: relative;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .graph-header {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      flex-wrap: wrap;
      flex-shrink: 0;
    }

    .btn-open-graph-modal {
      border: none;
      cursor: pointer;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: #fd7e14;
      color: white;
      transition: all 0.2s ease;
    }

    .btn-open-graph-modal:hover {
      background: #e46f10;
      transform: scale(1.02);
    }

    .graph-canvas-wrapper {
      width: 100%;
      flex: 1;
      min-height: 280px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }

    .graph-canvas {
      width: 100% !important;
      height: 100% !important;
      display: block;
    }

    /* ✅ MODAL PLEIN ÉCRAN AVEC BLUR */
    .graph-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
    }

    .graph-modal {
      width: 90%;
      max-width: 1200px;
      height: 85%;
      max-height: 800px;
      background: white;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }

    .graph-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
      flex-shrink: 0;
    }

    .graph-modal-header h3 {
      margin: 0;
      font-size: 18px;
      color: #1e293b;
    }

    .btn-close-graph-modal {
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 20px;
      color: #94a3b8;
    }

    .btn-close-graph-modal:hover {
      color: #ef4444;
    }

    .graph-modal-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }

    .graph-form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .graph-form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .graph-form-group label {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
    }

    .graph-form-group input,
    .graph-form-group select,
    .graph-form-group textarea {
      width: 100%;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
      font-family: inherit;
    }

    .graph-form-group input:focus,
    .graph-form-group select:focus,
    .graph-form-group textarea:focus {
      border-color: #fd7e14;
      box-shadow: 0 0 0 2px rgba(253,126,20,0.1);
    }

    .graph-series-builder {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 12px;
    }

    .graph-series-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .btn-add-series {
      border: none;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      background: #10b981;
      color: white;
    }

    .graph-series-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .graph-series-item {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      background: #f8fafc;
    }

    .graph-series-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .btn-remove-series {
      border: none;
      cursor: pointer;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      background: #ef4444;
      color: white;
    }

    .graph-help-text {
      font-size: 12px;
      color: #64748b;
      background: #fef3c7;
      border-radius: 10px;
      padding: 10px;
      margin-top: 10px;
    }

    .graph-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid #e2e8f0;
      flex-shrink: 0;
    }

    .btn-cancel-graph,
    .btn-save-graph {
      border: none;
      cursor: pointer;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 14px;
      transition: all 0.2s;
    }

    .btn-cancel-graph {
      background: #f1f5f9;
      color: #475569;
    }

    .btn-cancel-graph:hover {
      background: #e2e8f0;
    }

    .btn-save-graph {
      background: #fd7e14;
      color: white;
    }

    .btn-save-graph:hover {
      background: #e46f10;
    }
  `,

  customEvents: (blockEl, blockData) => {
    blockEl._graphBlockData = blockData;
    const openBtn = blockEl.querySelector(".btn-open-graph-modal");
    const closeBtn = blockEl.querySelector(".btn-close-graph-modal");
    const cancelBtn = blockEl.querySelector(".btn-cancel-graph");
    const saveBtn = blockEl.querySelector(".btn-save-graph");
    const overlay = blockEl.querySelector(".graph-modal-overlay");
    const modal = blockEl.querySelector(".graph-modal");

    const modeInput = blockEl.querySelector(".graph-mode-input");
    const typeInput = blockEl.querySelector(".graph-type-input");
    const titleInput = blockEl.querySelector(".graph-title-input");
    const labelsInput = blockEl.querySelector(".graph-labels-input");
    const functionInput = blockEl.querySelector(".graph-function-input");
    const xMinInput = blockEl.querySelector(".graph-xmin-input");
    const xMaxInput = blockEl.querySelector(".graph-xmax-input");
    const stepInput = blockEl.querySelector(".graph-step-input");
    const gridXInput = blockEl.querySelector(".graph-gridx-input");
    const gridYInput = blockEl.querySelector(".graph-gridy-input");

    const sectionData = blockEl.querySelector(".section-data");
    const sectionFunction = blockEl.querySelector(".section-function");
    const seriesList = blockEl.querySelector(".graph-series-list");
    const addSeriesBtn = blockEl.querySelector(".btn-add-series");

    const canvas = blockEl.querySelector(".graph-canvas");
    const canvasWrapper = blockEl.querySelector(".graph-canvas-wrapper");

    let chartInstance = null;
    let tempContent = normalizeGraphContent(blockData.content);
    let resizeObserver = null;

    function stopModalPropagation() {
      modal?.addEventListener("click", (e) => e.stopPropagation());
      modal?.addEventListener("mousedown", (e) => e.stopPropagation());

      modal?.querySelectorAll("input, textarea, select, button, label").forEach((el) => {
        el.addEventListener("click", (e) => e.stopPropagation());
        el.addEventListener("mousedown", (e) => e.stopPropagation());
        el.addEventListener("dblclick", (e) => e.stopPropagation());
      });
    }

    function toggleModeUI() {
      const mode = modeInput.value;
      sectionData.style.display = mode === "data" ? "" : "none";
      sectionFunction.style.display = mode === "function" ? "" : "none";
    }

    function parseMultilineText(text) {
      return text.split("\n").map(item => item.trim()).filter(item => item !== "");
    }

    function parseMultilineNumbers(text) {
      return text.split("\n")
        .map(item => item.trim())
        .filter(item => item !== "")
        .map(item => Number(item.replace(",", ".")))
        .filter(item => !Number.isNaN(item));
    }

    function safeNumber(value, fallback) {
      const n = Number(String(value).replace(",", "."));
      return Number.isFinite(n) ? n : fallback;
    }

    function getColors(count) {
      const palette = [
        { bg: "rgba(59,130,246,0.45)", border: "rgba(59,130,246,1)" },
        { bg: "rgba(16,185,129,0.45)", border: "rgba(16,185,129,1)" },
        { bg: "rgba(245,158,11,0.45)", border: "rgba(245,158,11,1)" },
        { bg: "rgba(239,68,68,0.45)", border: "rgba(239,68,68,1)" }
      ];
      return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
    }

    function renderSeriesBuilder() {
      const datasets = Array.isArray(tempContent.datasets) ? tempContent.datasets : [];

      if (!datasets.length) {
        tempContent.datasets = [{ label: "Série 1", values: [] }];
      }

      seriesList.innerHTML = "";

      tempContent.datasets.forEach((dataset, index) => {
        const item = document.createElement("div");
        item.className = "graph-series-item";
        item.innerHTML = `
          <div class="graph-series-top">
            <strong>Série ${index + 1}</strong>
            <button class="btn-remove-series" type="button" data-index="${index}">
              <i class="fas fa-trash"></i> Supprimer
            </button>
          </div>
          <div class="graph-form-group">
            <label>Nom de la série</label>
            <input type="text" class="series-label-input" data-index="${index}" value="${escapeHtml(dataset.label || "")}">
          </div>
          <div class="graph-form-group">
            <label>Valeurs (une par ligne)</label>
            <textarea class="series-values-input" data-index="${index}" rows="5">${(dataset.values || []).join("\n")}</textarea>
          </div>
        `;
        seriesList.appendChild(item);
      });

      seriesList.querySelectorAll(".series-label-input").forEach(input => {
        input.addEventListener("input", () => {
          const index = Number(input.dataset.index);
          if (tempContent.datasets[index]) {
            tempContent.datasets[index].label = input.value;
          }
        });
      });

      seriesList.querySelectorAll(".series-values-input").forEach(textarea => {
        textarea.addEventListener("input", () => {
          const index = Number(textarea.dataset.index);
          if (tempContent.datasets[index]) {
            tempContent.datasets[index].values = parseMultilineNumbers(textarea.value);
          }
        });
      });

      seriesList.querySelectorAll(".btn-remove-series").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const index = Number(btn.dataset.index);
          if (tempContent.datasets.length > 1) {
            tempContent.datasets.splice(index, 1);
            renderSeriesBuilder();
          }
        });
      });
    }

   // syncTempContentFromForm - doit être présente dans ton code
function syncTempContentFromForm() {
  tempContent.mode = modeInput.value;
  tempContent.chartType = typeInput.value;
  tempContent.chartTitle = titleInput.value.trim() || "Mon graphique";
  tempContent.gridStepX = safeNumber(gridXInput.value, 1);
  tempContent.gridStepY = safeNumber(gridYInput.value, 1);

  if (tempContent.mode === "data") {
    tempContent.labels = parseMultilineText(labelsInput.value);
    // Les datasets sont déjà mis à jour via renderSeriesBuilder
  }

  if (tempContent.mode === "function") {
    tempContent.functionExpr = functionInput.value.trim() || "sin(x)";
    tempContent.xMin = safeNumber(xMinInput.value, -10);
    tempContent.xMax = safeNumber(xMaxInput.value, 10);
    tempContent.step = safeNumber(stepInput.value, 0.1);
  }
}

    function fillFormFromTempContent() {
      modeInput.value = tempContent.mode;
      typeInput.value = tempContent.chartType;
      titleInput.value = tempContent.chartTitle || "";
      labelsInput.value = (tempContent.labels || []).join("\n");
      functionInput.value = tempContent.functionExpr || "sin(x)";
      xMinInput.value = tempContent.xMin;
      xMaxInput.value = tempContent.xMax;
      stepInput.value = tempContent.step;
      gridXInput.value = tempContent.gridStepX;
      gridYInput.value = tempContent.gridStepY;

      toggleModeUI();
      renderSeriesBuilder();
    }

    function openModal() {
      tempContent = normalizeGraphContent(blockData.content);
      fillFormFromTempContent();
      overlay.style.display = "flex";
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      overlay.style.display = "none";
      document.body.style.overflow = "";
    }

    function buildFunctionPoints(expr, xMin, xMax, step) {
      const points = [];
      for (let x = xMin; x <= xMax + step / 2; x += step) {
        try {
          // ✅ Utiliser math.evaluate
          const y = math.evaluate(expr, { x: x });
          if (Number.isFinite(y) && !isNaN(y)) {
            points.push({ x: Number(x.toFixed(10)), y });
          }
        } catch (e) {
          console.warn(`Erreur évaluation ${expr} à x=${x}:`, e.message);
        }
      }
      return points;
    }

    function ensureCanvasHeight() {
      const blockHeight = blockEl.clientHeight || 460;
      const headerHeight = blockEl.querySelector(".graph-header")?.offsetHeight || 50;
      const calculated = Math.max(260, blockHeight - headerHeight - 40);
      canvasWrapper.style.height = `${calculated}px`;
    }

    function renderChart() {
      ensureCanvasHeight();

      if (typeof Chart === "undefined") {
        canvasWrapper.innerHTML = `<div style="padding:20px; color:#b91c1c;">Chart.js non chargé</div>`;
        return;
      }

      const content = normalizeGraphContent(blockData.content);

      if (chartInstance) {
        chartInstance.destroy();
      }

      const ctx = canvas.getContext("2d");

      if (content.mode === "function") {
        let points = [];
        try {
          points = buildFunctionPoints(content.functionExpr, content.xMin, content.xMax, content.step);
        } catch (err) {
          canvasWrapper.innerHTML = `<div style="padding:20px; color:#b91c1c;">${err.message}</div>`;
          return;
        }

        chartInstance = new Chart(ctx, {
          type: "line",
          data: {
            datasets: [{
              label: content.functionExpr,
              data: points,
              parsing: false,
              borderColor: "rgba(59,130,246,1)",
              backgroundColor: "rgba(59,130,246,0.15)",
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.15
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true },
              title: { display: !!content.chartTitle, text: content.chartTitle }
            },
            scales: {
              x: { type: "linear", min: content.xMin, max: content.xMax },
              y: { ticks: { stepSize: content.gridStepY } }
            }
          }
        });
        return;
      }

      const labels = Array.isArray(content.labels) ? content.labels : [];
      const colors = getColors(content.datasets.length || 1);

      const datasets = (content.datasets || []).map((ds, i) => ({
        label: ds.label || `Série ${i + 1}`,
        data: Array.isArray(ds.values) ? ds.values : [],
        backgroundColor: colors[i].bg,
        borderColor: colors[i].border,
        borderWidth: 2,
        tension: 0.25,
        pointRadius: content.chartType === "line" ? 3 : 0
      }));

      chartInstance = new Chart(ctx, {
        type: content.chartType,
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true },
            title: { display: !!content.chartTitle, text: content.chartTitle }
          }
        }
      });
    }

    // ✅ CORRECTION : Sauvegarde correcte des modifications
    function saveGraphConfig() {
      console.log("🔵 saveGraphConfig - début");
      
      // 1. Synchroniser tempContent avec le formulaire
      syncTempContentFromForm();
      console.log("🔵 tempContent après sync:", tempContent);
      
      // 2. Mettre à jour blockData.content
      blockData.content = cloneDeep(tempContent);
      console.log("🔵 blockData.content mis à jour:", blockData.content);
      
      // 3. Mettre à jour l'état global
      updateBlockContent(blockData.id, { content: cloneDeep(tempContent) });
      console.log("🔵 updateBlockContent appelé pour:", blockData.id);
      
      // 4. Re-rendre le graphique
      renderChart();
      
      // 5. Fermer le modal
      closeModal();
      
      // 6. Déclencher l'auto-save
      if (window.triggerAutoSave) {
        console.log("🔵 Déclenchement auto-save");
        setTimeout(() => window.triggerAutoSave(), 100);
      }
      
      console.log("🔵 saveGraphConfig - fin");
    }

    modeInput?.addEventListener("change", () => {
      syncTempContentFromForm();
      toggleModeUI();
    });

    [titleInput, labelsInput, functionInput, xMinInput, xMaxInput, stepInput, gridXInput, gridYInput].forEach((el) => {
      el?.addEventListener("input", () => syncTempContentFromForm());
    });

    typeInput?.addEventListener("change", () => syncTempContentFromForm());

    addSeriesBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      tempContent.datasets.push({ label: `Série ${tempContent.datasets.length + 1}`, values: [] });
      renderSeriesBuilder();
    });

    openBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal();
    });

    closeBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      closeModal();
    });

    cancelBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      closeModal();
    });

    saveBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      saveGraphConfig();
    });

    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    stopModalPropagation();
    renderChart();

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        ensureCanvasHeight();
        chartInstance?.resize();
      });
      resizeObserver.observe(blockEl);
    }

    if (!blockData.content) {
      blockData.content = cloneDeep(defaultGraphContent);
      updateBlockContent(blockData.id, { content: cloneDeep(defaultGraphContent) });
    }
    renderChart();
  }
};

const graphBlock = createBlockType("graph", graphConfig);

export const createGraphData = graphBlock.createData;
export const renderGraph = graphBlock.render;
export const attachGraphEvents = graphBlock.attachEvents;
export const addGraph = graphBlock.add;

// ✅ Sérialisation

// graph.js - à la fin du fichier
export function serializeGraph(blockEl) {
  // Récupérer les données depuis l'attribut ou depuis blockData
  const blockData = blockEl._graphBlockData;
  if (blockData && blockData.content) {
    return blockData.content;
  }
  return defaultGraphContent;
}