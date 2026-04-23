// blockRegistry.js

import { renderSituation,serializeSituation } from "./situation.js";
import { renderProblematic,serializeProblematic } from "./problematic.js";
import { renderText, serializeText} from "./text.js";
import { renderImage } from "./image.js";
import { renderQuestion, serializeQuestion } from "./question.js";
import { renderSpaceAnswer,serializeSpaceAnswer } from "./spaceAnswer.js";
import { renderTable,serializeTable} from "./table.js";
import { renderGraph } from "./graph.js";
import { renderQcm,serializeQcm} from "./qcm.js";

export const blockRegistry = {
  situation: {
    render: (blockData) => renderSituation(blockData),
    serialize: (blockEl) => serializeSituation(blockEl)
  },
  problematic: {
    render: (blockData) => renderProblematic(blockData),
    serialize: (blockEl) => serializeProblematic(blockEl)
  },
  text: {
    render: (blockData) => renderText(blockData),
    serialize: (blockEl) => serializeText(blockEl)
  },
  image: {
    render: (blockData) => renderImage(blockData)
  },
// blockRegistry.js - assure-toi que cette ligne est présente
question: {
  render: (blockData) => renderQuestion(blockData),
  serialize: (blockEl) => serializeQuestion(blockEl)  
},
  spaceAnswer: {
    render: (blockData) => renderSpaceAnswer(blockData),
    serialize: (blockEl) => serializeSpaceAnswer(blockEl)
  },
  table: {
    render: (blockData) => renderTable(blockData),
    serialize: (blockEl) => serializeTable(blockEl)
  },
  graph: {
    render: (blockData) => renderGraph(blockData)
  },
  qcm: {
    render: (blockData) => renderQcm(blockData),
    serialize: (blockEl) => serializeQcm(blockEl)
  },
};

export function renderBlock(blockData) {
  const handler = blockRegistry[blockData.type];

  if (!handler) {
    console.error(`Type de bloc inconnu : ${blockData.type}`);
    return null;
  }

  return handler.render(blockData);
}

// blockRegistry.js - ajoute ce log

// blockRegistry.js - dans serializeBlock

// blockRegistry.js

export function serializeBlock(blockEl) {
  const blockType = blockEl.dataset.type;
  const handler = blockRegistry[blockType];
  
  console.log("🔵 serializeBlock appelé pour:", blockType);
  console.log("🔵 handler existe:", !!handler);
  console.log("🔵 handler.serialize existe:", !!(handler && handler.serialize));
  
  if (handler && handler.serialize) {
    const result = handler.serialize(blockEl);
    console.log("🔵 Résultat serialize pour", blockType, ":", result);
    return result;
  }
  
  // Fallback
  const contentEl = blockEl.querySelector('[data-field="content"]');
  const fallback = contentEl ? contentEl.innerHTML : '';
  console.log("🔵 FALLBACK utilisé pour", blockType, ":", fallback);
  return fallback;
}