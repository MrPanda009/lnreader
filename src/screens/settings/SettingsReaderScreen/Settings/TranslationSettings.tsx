import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { TextInput, Portal } from 'react-native-paper';
import { useChapterGeneralSettings, useTheme } from '@hooks/persisted';
import { List, Modal, Button, RadioButton } from '@components';
import { getString } from '@strings/translations';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese (Simplified)' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ru', label: 'Russian' },
  { code: 'id', label: 'Indonesian' },
];

interface TextInputModalProps {
  visible: boolean;
  onDismiss: () => void;
  defaultValue?: string;
  onSubmit: (val: string) => void;
  secureTextEntry?: boolean;
  title: string;
}

const TextInputModal: React.FC<TextInputModalProps> = ({
  visible,
  onDismiss,
  defaultValue = '',
  onSubmit,
  secureTextEntry,
  title,
}) => {
  const theme = useTheme();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (visible) {
      setValue(defaultValue);
    }
  }, [visible, defaultValue]);

  const handleSave = () => {
    onSubmit(value);
    onDismiss();
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss}>
        <Text style={[styles.modalTitle, { color: theme.onSurface }]}>
          {title}
        </Text>
        <TextInput
          value={value}
          onChangeText={setValue}
          mode="outlined"
          secureTextEntry={secureTextEntry}
          underlineColor={theme.outline}
          theme={{ colors: { ...theme } }}
          style={styles.textInput}
        />
        <View style={styles.btnContainer}>
          <Button
            title={getString('common.save')}
            onPress={handleSave}
          />
          <Button title={getString('common.cancel')} onPress={onDismiss} />
        </View>
      </Modal>
    </Portal>
  );
};

interface LanguagePickerModalProps {
  visible: boolean;
  onDismiss: () => void;
  currentLanguage: string;
  onSelect: (lang: string) => void;
  languages: { code: string; label: string }[];
}

const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  visible,
  onDismiss,
  currentLanguage,
  onSelect,
  languages,
}) => {
  const theme = useTheme();

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss}>
        <Text style={[styles.modalTitle, { color: theme.onSurface }]}>
          Translate to
        </Text>
        <ScrollView style={styles.scroll}>
          {languages.map(item => (
            <RadioButton
              key={item.code}
              status={currentLanguage === item.code}
              onPress={() => {
                onSelect(item.code);
                onDismiss();
              }}
              label={item.label}
              theme={theme}
            />
          ))}
        </ScrollView>
      </Modal>
    </Portal>
  );
};

export function TranslationSettings() {
  const theme = useTheme();
  const { googleTranslateApiKey = '', translationTargetLang = 'en', setChapterGeneralSettings } =
    useChapterGeneralSettings();
  const [keyVisible, setKeyVisible] = useState(false);
  const [langVisible, setLangVisible] = useState(false);

  return (
    <>
      <List.SubHeader theme={theme}>Translation</List.SubHeader>

      {/* API Key */}
      <List.Item
        title="Google Translate API Key"
        description={googleTranslateApiKey ? '••••••••' : 'Not configured'}
        icon="key"
        onPress={() => setKeyVisible(true)}
        theme={theme}
      />
      <TextInputModal
        visible={keyVisible}
        onDismiss={() => setKeyVisible(false)}
        defaultValue={googleTranslateApiKey}
        onSubmit={val => setChapterGeneralSettings({ googleTranslateApiKey: val })}
        secureTextEntry
        title="Google Translate API Key"
      />

      {/* Target Language */}
      <List.Item
        title="Translate to"
        description={LANGUAGES.find(l => l.code === translationTargetLang)?.label || 'English'}
        icon="web"
        onPress={() => setLangVisible(true)}
        theme={theme}
      />
      <LanguagePickerModal
        visible={langVisible}
        onDismiss={() => setLangVisible(false)}
        currentLanguage={translationTargetLang}
        onSelect={val => setChapterGeneralSettings({ translationTargetLang: val })}
        languages={LANGUAGES}
      />
    </>
  );
}

const styles = StyleSheet.create({
  btnContainer: {
    flexDirection: 'row-reverse',
    marginTop: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  textInput: {
    fontSize: 14,
    marginVertical: 8,
  },
  scroll: {
    maxHeight: 300,
  },
});
