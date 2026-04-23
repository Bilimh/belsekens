export function generateId(prefix = "blk") {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  }