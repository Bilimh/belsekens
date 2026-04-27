// blockRegistry.js

import { renderSituation,serializeSituation } from "./situation.js";
import { renderProblematic,serializeProblematic } from "./problematic.js";
import { renderText, serializeText} from "./text.js";
import { renderImage,serializeImage } from "./image.js";
import { renderQuestion, serializeQuestion } from "./question.js";
import { renderSpaceAnswer,serializeSpaceAnswer } from "./spaceAnswer.js";
import { renderTable,serializeTable} from "./table.js";
import { renderGraph, serializeGraph } from "./graph.js";
import { renderQcm,serializeQcm} from "./qcm.js";
import { renderVideo, serializeVideo } from "./video.js";
import { renderAudio, serializeAudio } from "./audio.js";
//import { renderMindmap, serializeMindmap } from "./mindmap.js";
import { renderMindmap, serializeMindmap } from "./mindmap/index.js";
export const blockRegistry = {
  situation: {
    render: (blockData) => {
      //console.log("🔵 REGISTRY - blockData reçu:", JSON.stringify(blockData, null, 2));
      return renderSituation(blockData);
    },
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
    render: (blockData) => renderImage(blockData),
    serialize: (blockEl) => serializeImage(blockEl)
  },

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
    render: (blockData) => renderGraph(blockData),
    serialize: (blockEl) => serializeGraph(blockEl),
  },
  qcm: {
    render: (blockData) => renderQcm(blockData),
    serialize: (blockEl) => serializeQcm(blockEl)
  },
  video: {
    render: (blockData) => renderVideo(blockData),
    serialize: (blockEl) => serializeVideo(blockEl)
  },
  audio: {
    render: (blockData) => renderAudio(blockData),
    serialize: (blockEl) => serializeAudio(blockEl)
  },
  mindmap: {
    render: (blockData) => renderMindmap(blockData),
    serialize: (blockEl) => serializeMindmap(blockEl)
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


export function serializeBlock(blockEl) {
  const blockType = blockEl.dataset.type;
  const handler = blockRegistry[blockType];
  
  //console.log("🔵 serializeBlock - type:", blockType);
  
  if (handler && handler.serialize) {
    const result = handler.serialize(blockEl);
    //console.log("🔵 serializeBlock - résultat pour", blockType, ":", result);
    return result;
  }
  
  const contentEl = blockEl.querySelector('[data-field="content"]');
  return contentEl ? contentEl.innerHTML : '';
}