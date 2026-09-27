import * as FileSystem from 'expo-file-system/legacy';

function path(id) {
  if (!FileSystem.documentDirectory) throw new Error('Local planning notes require a phone.');
  return `${FileSystem.documentDirectory}sidequest-plan-${encodeURIComponent(id)}.json`;
}

export async function loadPlanningNotes(id) {
  const file = path(id);
  if (!(await FileSystem.getInfoAsync(file)).exists) return [];
  const notes = JSON.parse(await FileSystem.readAsStringAsync(file));
  return Array.isArray(notes) ? notes : [];
}

export async function savePlanningNotes(id, draft) {
  const notes = draft.map((item, position) => ({ ...item, position })).filter(item => item.custom);
  await FileSystem.writeAsStringAsync(path(id), JSON.stringify(notes));
}
