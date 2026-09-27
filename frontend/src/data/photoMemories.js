import * as FileSystem from 'expo-file-system/legacy';

function root() {
  if (!FileSystem.documentDirectory) throw new Error('Photo memories need a mobile device.');
  return `${FileSystem.documentDirectory}sidequest-memories/`;
}

function folder(adventureId, stopId) {
  return `${root()}${encodeURIComponent(adventureId)}_${encodeURIComponent(stopId)}/`;
}

export async function getPhotoMemory(adventureId, stopId) {
  const path = `${folder(adventureId, stopId)}memory.json`;
  if (!(await FileSystem.getInfoAsync(path)).exists) return null;
  const memory = JSON.parse(await FileSystem.readAsStringAsync(path));
  // Resolve relative filenames again after an app restart.
  return { ...memory, uri: `${folder(adventureId, stopId)}${memory.filename}` };
}

export async function savePhotoMemory({ adventureId, stopId, title, uri }) {
  const directory = folder(adventureId, stopId);
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const extension = uri.split('?')[0].match(/\.(jpe?g|png|heic|webp)$/i)?.[1] || 'jpg';
  const filename = `photo-${Date.now()}.${extension}`;
  await FileSystem.copyAsync({ from: uri, to: `${directory}${filename}` });
  const memory = { adventureId, stopId, title, filename, createdAt: new Date().toISOString() };
  await FileSystem.writeAsStringAsync(`${directory}memory.json`, JSON.stringify(memory));
  return { ...memory, uri: `${directory}${filename}` };
}

export async function getPhotoMemories() {
  if (!(await FileSystem.getInfoAsync(root())).exists) return [];
  const entries = await FileSystem.readDirectoryAsync(root());
  const memories = [];
  for (const entry of entries) {
    const path = `${root()}${entry}/memory.json`;
    if (!(await FileSystem.getInfoAsync(path)).exists) continue;
    const memory = JSON.parse(await FileSystem.readAsStringAsync(path));
    const uri = `${root()}${entry}/${memory.filename}`;
    if ((await FileSystem.getInfoAsync(uri)).exists) memories.push({ ...memory, uri });
  }
  return memories.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
