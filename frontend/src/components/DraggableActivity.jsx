import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

// Hold the numbered handle, then move the row. Short movements still scroll.
export default function DraggableActivity({ index, item, disabled, canRemove, onEdit, onRemove, onDrop, onDragging, onLayout }) {
  const [offset] = useState(() => new Animated.Value(0));
  const armed = useRef(false);
  const timer = useRef(null);
  const [dragging, setDragging] = useState(false);
  const latest = useRef({ onDrop, onDragging, disabled });
  useEffect(() => { latest.current = { onDrop, onDragging, disabled }; }, [onDrop, onDragging, disabled]);
  function finish(dy, commit) {
    clearTimeout(timer.current);
    if (armed.current && commit) latest.current.onDrop(dy);
    armed.current = false;
    offset.setValue(0);
    setDragging(false);
    latest.current.onDragging(false);
  }
  // PanResponder registers these callbacks; refs are read later during gestures.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !latest.current.disabled,
    onPanResponderGrant: () => {
      timer.current = setTimeout(() => {
        armed.current = true;
        setDragging(true);
        latest.current.onDragging(true);
      }, 350);
    },
    onPanResponderMove: (_, gesture) => {
      if (armed.current) offset.setValue(gesture.dy);
      else if (Math.abs(gesture.dy) > 8) clearTimeout(timer.current);
    },
    onPanResponderRelease: (_, gesture) => finish(gesture.dy, true),
    onPanResponderTerminationRequest: () => !armed.current,
    onPanResponderTerminate: () => finish(0, false),
  }));
  useEffect(() => () => clearTimeout(timer.current), []);

  return <Animated.View onLayout={onLayout} style={[styles.row, dragging && styles.lifted, { transform: [{ translateY: offset }] }]}>
    <View {...responder.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel={`Reorder ${item.name}, position ${index + 1}`} accessibilityHint="Hold and drag, or use accessibility move actions."
      accessibilityActions={[{ name: 'increment', label: 'Move down' }, { name: 'decrement', label: 'Move up' }]}
      onAccessibilityAction={event => { if (!disabled) onDrop(0, event.nativeEvent.actionName === 'increment' ? 1 : -1); }} style={styles.number}>
      <Text style={styles.numberText}>{index + 1}</Text><Text style={styles.grip}>⠿</Text>
    </View>
    <View style={styles.copy}><Text style={styles.name}>{item.name}</Text><Text style={styles.detail}>{item.custom ? 'Local planning note' : `${item.category} · ${item.estimatedCost ? `~$${item.estimatedCost}` : 'Free'}`}</Text></View>
    <View style={styles.end}><Text style={styles.time}>{item.estimatedMinutes} min</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${item.name}`} disabled={disabled} onPress={onEdit} style={styles.edit}><Text style={styles.editText}>Edit</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.name}`} disabled={disabled || !canRemove} onPress={onRemove} style={[styles.remove, !canRemove && styles.disabled]}><Text style={styles.removeText}>Remove</Text></Pressable>
      </View>
    </View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 110, paddingVertical: 18, borderBottomWidth: 1, borderColor: '#D5DEDA', backgroundColor: '#FFFDFA' },
  lifted: { zIndex: 20, elevation: 8, shadowColor: '#173E39', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, borderRadius: 12 },
  number: { backgroundColor: '#F0F4D5', borderRadius: 14, width: 44, minHeight: 56, justifyContent: 'center', alignItems: 'center' },
  numberText: { color: '#173E39', fontSize: 15, fontWeight: '700' }, grip: { color: '#6B817B', fontSize: 12 }, copy: { flex: 1 },
  name: { color: '#173E39', fontSize: 14, lineHeight: 20 }, detail: { color: '#6B817B', fontSize: 11, lineHeight: 17, marginTop: 7 },
  end: { alignItems: 'flex-end', gap: 8 }, time: { color: '#173E39', fontSize: 12 }, actions: { flexDirection: 'row', gap: 5 },
  edit: { paddingHorizontal: 8, minHeight: 44, justifyContent: 'center', borderRadius: 10, backgroundColor: '#F0F4D5' }, editText: { color: '#173E39', fontSize: 10, fontWeight: '700' },
  remove: { paddingHorizontal: 8, minHeight: 44, justifyContent: 'center', borderRadius: 10, backgroundColor: '#FFF0E9' }, removeText: { color: '#A23528', fontSize: 10, fontWeight: '700' }, disabled: { opacity: 0.35 },
});
