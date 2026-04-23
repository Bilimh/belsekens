// table.js

import { createBlockType } from "./baseBlock.js";
import { updateBlockContent } from "./editorState.js";

const tableConfig = {
  defaultTitle: "Tableau",
  defaultContent: [
    ["", ""],
    ["", ""]
  ],

  defaultWidth: 700,
  defaultHeight: 120,
  defaultLeft: 40,
  defaultTop: 40,

  icon: "fas fa-table",
  iconColor: "#0d6efd",
  className: "table-block",
  autoStack: true,

  fields: [],

  customHtml: (data) => {
    let tableData = [];

    if (Array.isArray(data.content)) {
      tableData = data.content;
    } else if (typeof data.content === "string") {
      try {
        const parsed = JSON.parse(data.content);
        if (Array.isArray(parsed)) {
          tableData = parsed;
        } else {
          tableData = [
            ["", ""],
            ["", ""]
          ];
        }
      } catch {
        tableData = [
          ["", ""],
          ["", ""]
        ];
      }
    } else {
      tableData = [
        ["", ""],
        ["", ""]
      ];
    }

    if (!tableData.length) {
      tableData = [
        ["", ""],
        ["", ""]
      ];
    }

    const maxCols = Math.max(...tableData.map((row) => row.length), 1);
    tableData = tableData.map((row) => {
      const normalizedRow = [...row];
      while (normalizedRow.length < maxCols) {
        normalizedRow.push("");
      }
      return normalizedRow;
    });

    const rowsHtml = tableData
      .map((row, rowIndex) => {
        const cellsHtml = row
          .map((cell, colIndex) => {
            const content = cell || "";
            return `
              <td class="table-td">
                <div 
                  class="table-cell"
                  data-row="${rowIndex}"
                  data-col="${colIndex}"
                  tabindex="0"
                >${content || "<br>"}</div>
              </td>
            `;
          })
          .join("");

        return `<tr>${cellsHtml}</tr>`;
      })
      .join("");

    return `
      <div class="table-block-container">
        <div class="table-wrapper">
          <table class="table-block-table">
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <div class="table-block-controls">
          <button class="btn-add-row" title="Ajouter une ligne">
            <i class="fas fa-plus"></i> Ligne
          </button>
          <button class="btn-remove-row" title="Supprimer une ligne">
            <i class="fas fa-minus"></i> Ligne
          </button>
          <button class="btn-add-col" title="Ajouter une colonne">
            <i class="fas fa-plus"></i> Colonne
          </button>
          <button class="btn-remove-col" title="Supprimer une colonne">
            <i class="fas fa-minus"></i> Colonne
          </button>
        </div>
      </div>
    `;
  },

  customCSS: `
    .table-block-container {
      width: 100%;
      background: transparent;
      padding: 6px;
    }

    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
    }

    .table-block-table {
      border-collapse: collapse;
      table-layout: auto;
      width: max-content;
      min-width: 100%;
      background: white;
      border: 1px solid black;
    }

    .table-block-table tr:nth-child(even) td {
      background: #fcfcfc;
    }

    .table-td {
      border: 1px solid black;
      vertical-align: top;
      padding: 0;
    }

    .table-cell {
      min-width: 60px;
      min-height: 38px;
      padding: 8px 10px;
      outline: none;
      cursor: text;
      line-height: 1.4;
      font-size: 16px;
      color: #222;
      background: transparent;
      white-space: nowrap;
    }

    .table-cell:hover {
      background: #f8fbff;
    }

    .table-cell[contenteditable="true"] {
      background: #eef6ff;
      box-shadow: inset 0 0 0 1px #0d6efd;
    }

    .table-cell:empty:before {
      content: "Saisir...";
      color: #a0a0a0;
      font-style: italic;
      font-size: 12px;
    }

    .table-block-controls {
      display: none;
      gap: 8px;
      margin-top: 12px;
      flex-wrap: wrap;
    }

    .table-block-container:hover .table-block-controls {
      display: flex;
    }

    .table-block-controls button {
      border: none;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      color: white;
    }

    .btn-add-row,
    .btn-add-col {
      background: #198754;
    }

    .btn-add-row:hover,
    .btn-add-col:hover {
      background: #157347;
      transform: scale(1.02);
    }

    .btn-remove-row,
    .btn-remove-col {
      background: #dc3545;
    }

    .btn-remove-row:hover,
    .btn-remove-col:hover {
      background: #bb2d3b;
      transform: scale(1.02);
    }
  `,

  customEvents: (blockEl, blockData) => {
    const table = blockEl.querySelector(".table-block-table");
    const tbody = table.querySelector("tbody");

    const addRowBtn = blockEl.querySelector(".btn-add-row");
    const removeRowBtn = blockEl.querySelector(".btn-remove-row");
    const addColBtn = blockEl.querySelector(".btn-add-col");
    const removeColBtn = blockEl.querySelector(".btn-remove-col");

    function normalizeContent(html) {
      if (
        html === "" ||
        html === "<br>" ||
        html === "&nbsp;" ||
        html === "<div><br></div>"
      ) {
        return "";
      }
      return html;
    }

    function getRowCount() {
      return tbody.querySelectorAll("tr").length;
    }

    function getColCount() {
      const firstRow = tbody.querySelector("tr");
      if (!firstRow) return 0;
      return firstRow.querySelectorAll(".table-cell").length;
    }

    function refreshIndexes() {
      const rows = tbody.querySelectorAll("tr");
      rows.forEach((rowEl, rowIndex) => {
        const cells = rowEl.querySelectorAll(".table-cell");
        cells.forEach((cell, colIndex) => {
          cell.setAttribute("data-row", rowIndex);
          cell.setAttribute("data-col", colIndex);
        });
      });
    }

    function saveAllCells() {
      const rows = tbody.querySelectorAll("tr");
      const tableData = [];

      rows.forEach((rowEl) => {
        const rowData = [];
        const cells = rowEl.querySelectorAll(".table-cell");

        cells.forEach((cell) => {
          let content = normalizeContent(cell.innerHTML.trim());
          rowData.push(content);
        });

        tableData.push(rowData);
      });

      blockData.content = [...tableData];
      updateBlockContent(blockData.id, { content: [...tableData] });

      if (window.triggerAutoSave) {
        window.triggerAutoSave();
      }
    }

    function saveOneCell(cell) {
      const rowIndex = parseInt(cell.getAttribute("data-row"), 10);
      const colIndex = parseInt(cell.getAttribute("data-col"), 10);

      let content = normalizeContent(cell.innerHTML.trim());

      const currentData = Array.isArray(blockData.content)
        ? blockData.content.map((row) => [...row])
        : [];

      while (currentData.length <= rowIndex) {
        currentData.push([]);
      }

      while (currentData[rowIndex].length <= colIndex) {
        currentData[rowIndex].push("");
      }

      currentData[rowIndex][colIndex] = content;

      blockData.content = currentData.map((row) => [...row]);
      updateBlockContent(blockData.id, { content: blockData.content.map((row) => [...row]) });

      if (window.triggerAutoSave) {
        window.triggerAutoSave();
      }
    }

    function enableCell(cell) {
      if (cell.getAttribute("contenteditable") !== "true") {
        cell.setAttribute("contenteditable", "true");
      }
      cell.focus();

      const range = document.createRange();
      range.selectNodeContents(cell);
      range.collapse(false);

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }

    function setupCellEvents(cell) {
      if (cell.hasAttribute("data-events-attached")) return;
      cell.setAttribute("data-events-attached", "true");
      
      cell.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });

      cell.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        enableCell(cell);
      });

      cell.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      cell.addEventListener("input", () => {
        saveOneCell(cell);
      });

      cell.addEventListener("blur", () => {
        saveOneCell(cell);
      });

      cell.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          cell.blur();
        }
      });
    }

    function setupAllCells() {
      const cells = tbody.querySelectorAll(".table-cell");
      cells.forEach((cell) => setupCellEvents(cell));
    }

    function createCell(rowIndex, colIndex, content = "") {
      const td = document.createElement("td");
      td.className = "table-td";

      const cell = document.createElement("div");
      cell.className = "table-cell";
      cell.setAttribute("data-row", rowIndex);
      cell.setAttribute("data-col", colIndex);
      cell.setAttribute("tabindex", "0");
      cell.innerHTML = content || "<br>";

      td.appendChild(cell);
      setupCellEvents(cell);

      return td;
    }

    function addRow() {
      const rowCount = getRowCount();
      const colCount = Math.max(getColCount(), 1);

      const tr = document.createElement("tr");
      for (let col = 0; col < colCount; col++) {
        tr.appendChild(createCell(rowCount, col, ""));
      }

      tbody.appendChild(tr);
      refreshIndexes();
      saveAllCells();
    }

    function removeRow() {
      const rows = tbody.querySelectorAll("tr");
      if (rows.length > 1) {
        rows[rows.length - 1].remove();
        refreshIndexes();
        saveAllCells();
      }
    }

    function addColumn() {
      const rows = tbody.querySelectorAll("tr");
      if (!rows.length) {
        addRow();
        return;
      }

      rows.forEach((rowEl, rowIndex) => {
        const colIndex = rowEl.querySelectorAll(".table-cell").length;
        rowEl.appendChild(createCell(rowIndex, colIndex, ""));
      });

      refreshIndexes();
      saveAllCells();
    }

    function removeColumn() {
      const rows = tbody.querySelectorAll("tr");
      if (!rows.length) return;

      const colCount = getColCount();
      if (colCount <= 1) return;

      rows.forEach((rowEl) => {
        const cells = rowEl.querySelectorAll(".table-td");
        if (cells.length > 1) {
          cells[cells.length - 1].remove();
        }
      });

      refreshIndexes();
      saveAllCells();
    }

    if (addRowBtn) {
      const newBtn = addRowBtn.cloneNode(true);
      addRowBtn.parentNode.replaceChild(newBtn, addRowBtn);

      newBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        addRow();
      });
    }

    if (removeRowBtn) {
      const newBtn = removeRowBtn.cloneNode(true);
      removeRowBtn.parentNode.replaceChild(newBtn, removeRowBtn);

      newBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeRow();
      });
    }

    if (addColBtn) {
      const newBtn = addColBtn.cloneNode(true);
      addColBtn.parentNode.replaceChild(newBtn, addColBtn);

      newBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        addColumn();
      });
    }

    if (removeColBtn) {
      const newBtn = removeColBtn.cloneNode(true);
      removeColBtn.parentNode.replaceChild(newBtn, removeColBtn);

      newBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeColumn();
      });
    }

    refreshIndexes();
    setupAllCells();

    if (!blockData.content || !Array.isArray(blockData.content) || blockData.content.length === 0) {
      saveAllCells();
    }
  }
};

const tableBlock = createBlockType("table", tableConfig);

export const createTableData = tableBlock.createData;
export const renderTable = tableBlock.render;
export const attachTableEvents = tableBlock.attachEvents;
export const addTable = tableBlock.add;

// ✅ Fonction de sérialisation pour la sauvegarde (AJOUT UNIQUEMENT)
export function serializeTable(blockEl) {
  const table = blockEl.querySelector(".table-block-table");
  if (!table) return [];
  
  const tbody = table.querySelector("tbody");
  if (!tbody) return [];
  
  const tableData = [];
  const rows = tbody.querySelectorAll("tr");
  
  rows.forEach((row) => {
    const rowData = [];
    const cells = row.querySelectorAll(".table-cell");
    
    cells.forEach((cell) => {
      let content = cell.innerHTML;
      if (content === "<br>" || content === "&nbsp;" || content === "") {
        rowData.push("");
      } else {
        rowData.push(content);
      }
    });
    
    tableData.push(rowData);
  });
  
  return tableData;
}