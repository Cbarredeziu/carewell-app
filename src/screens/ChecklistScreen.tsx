import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { ChecklistItem } from '../lib/types';
import { loadChecklist, saveChecklist } from '../lib/storage';

const ChecklistScreen = () => {
  const theme = useTheme();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');

  useEffect(() => {
    loadChecklist().then(setItems).catch(console.error);
  }, []);

  const toggle = async (id: string) => {
    const updated = items.map(item => (item.id === id ? { ...item, done: !item.done } : item));
    setItems(updated);
    await saveChecklist(updated);
  };

  const resetForm = () => {
    setLabel('');
    setEditingId(null);
  };

  const saveItem = async () => {
    if (!label.trim()) {
      Alert.alert('Missing label', 'Please enter a checklist item.');
      return;
    }
    const updated = editingId
      ? items.map(item => (item.id === editingId ? { ...item, label: label.trim() } : item))
      : [
          {
            id: `chk-${Date.now()}`,
            label: label.trim(),
            done: false
          },
          ...items
        ];
    setItems(updated);
    await saveChecklist(updated);
    setIsAdding(false);
    resetForm();
  };

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setLabel(item.label);
    setIsAdding(true);
  };

  const deleteItem = (item: ChecklistItem) => {
    Alert.alert('Delete item', `Remove "${item.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = items.filter(entry => entry.id !== item.id);
          setItems(updated);
          await saveChecklist(updated);
        }
      }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Daily checklist</Text>
        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}
          onPress={() => {
            resetForm();
            setIsAdding(true);
          }}
        >
          <Text style={[styles.secondaryText, { color: theme.colors.text }]}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.item, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
          >
            <TouchableOpacity style={styles.row} onPress={() => toggle(item.id)}>
              <Text style={[styles.label, { color: theme.colors.text }]}>{item.label}</Text>
              <View
                style={[styles.checkbox, { borderColor: theme.colors.border, backgroundColor: item.done ? theme.colors.primary : '#fff' }]}
              />
            </TouchableOpacity>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: theme.colors.border }]}
                onPress={() => startEdit(item)}
              >
                <Text style={[styles.actionText, { color: theme.colors.text }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: theme.colors.border }]}
                onPress={() => deleteItem(item)}
              >
                <Text style={[styles.deleteText, { color: theme.colors.primary }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      <Text style={[styles.note, { color: theme.colors.muted }]}>Resets daily.</Text>
      <Modal visible={isAdding} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card }]}> 
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {editingId ? 'Edit checklist item' : 'Add checklist item'}
            </Text>
            <TextInput
              placeholder="Label"
              value={label}
              onChangeText={setLabel}
              placeholderTextColor={theme.colors.muted}
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
                onPress={() => {
                  setIsAdding(false);
                  resetForm();
                }}
              >
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]} onPress={saveItem}>
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 0
  },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1
  },
  secondaryText: {
    fontWeight: '600'
  },
  item: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: 16,
    fontWeight: '600'
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1
  },
  actionText: {
    fontWeight: '600'
  },
  deleteText: {
    fontWeight: '600'
  },
  note: {
    marginTop: 12,
    fontSize: 13
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    borderRadius: 16,
    padding: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1
  },
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10
  },
  btnText: {
    color: '#fff',
    fontWeight: '600'
  }
});

export default ChecklistScreen;
