import React, { useCallback, useState, useMemo } from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import color from 'color';

import { TabView, SceneMap, TabBar, TabViewProps } from 'react-native-tab-view';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import BottomSheet from '@components/BottomSheet/BottomSheet';
import { getString } from '@strings/translations';

import { Checkbox, SortItem } from '@components/Checkbox/Checkbox';

import { overlay } from 'react-native-paper';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { ThemeColors } from '@theme/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNovelSettings } from '@hooks/persisted/useNovelSettings';

import { useNovelActions, useNovelValue } from '../NovelContext';
import { useTranslation } from '@hooks/persisted';
import { List, SwitchItem } from '@components';
import { updateNovelInfo } from '@database/queries/NovelQueries';
import { NovelInfo } from '@database/types';
import { LANGUAGES, LanguagePickerModal } from '../../settings/SettingsReaderScreen/Settings/TranslationSettings';

interface ChaptersSettingsSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModalMethods | null>;
  theme: ThemeColors;
}

const ChaptersSettingsSheet = ({
  bottomSheetRef,
  theme,
}: ChaptersSettingsSheetProps) => {
  const {
    setChapterSort,
    getChapterFilterState,
    cycleChapterFilter,
    setChapterFilterValue,
    setShowChapterTitles,
    sort,
    showChapterTitles,
  } = useNovelSettings();

  const novel = useNovelValue('novel');
  const chapters = useNovelValue('chapters');
  const { setNovel } = useNovelActions();
  const { translateChapters, isAnyTranslating } = useTranslation();

  const [langVisible, setLangVisible] = useState(false);

  const { left, right } = useSafeAreaInsets();
  const readStatus = getChapterFilterState('read');
  const unreadStatus =
    readStatus === 'indeterminate'
      ? true
      : readStatus
      ? 'indeterminate'
      : false;

  const updateNovel = useCallback(
    (updates: Partial<NovelInfo>) => {
      if (!novel) {
        return;
      }
      const updatedNovel = { ...novel, ...updates };
      setNovel(updatedNovel);
      updateNovelInfo(updatedNovel);
    },
    [novel, setNovel],
  );

  const downloadedChapters = useMemo(
    () => chapters.filter(c => c.isDownloaded),
    [chapters],
  );

  const untranslatedCount = useMemo(
    () =>
      downloadedChapters.filter(
        c => !c.translatedContent || c.translationLang !== novel?.translationLang,
      ).length,
    [downloadedChapters, novel?.translationLang],
  );

  const FirstRoute = useCallback(
    () => (
      <View style={styles.flex}>
        <Checkbox
          theme={theme}
          label={getString('novelScreen.bottomSheet.filters.downloaded')}
          status={getChapterFilterState('downloaded')}
          onPress={() => {
            cycleChapterFilter('downloaded');
          }}
        />
        <Checkbox
          theme={theme}
          label={getString('novelScreen.bottomSheet.filters.unread')}
          status={unreadStatus}
          onPress={() => {
            switch (readStatus) {
              case 'indeterminate':
                setChapterFilterValue('read', 'ON');
                break;
              case true:
                setChapterFilterValue('read', 'OFF');
                break;
              default:
                setChapterFilterValue('read', 'INDETERMINATE');
            }
          }}
        />
        <Checkbox
          theme={theme}
          label={getString('novelScreen.bottomSheet.filters.bookmarked')}
          status={getChapterFilterState('bookmarked')}
          onPress={() => {
            cycleChapterFilter('bookmarked');
          }}
        />
      </View>
    ),
    [
      cycleChapterFilter,
      getChapterFilterState,
      readStatus,
      setChapterFilterValue,
      theme,
      unreadStatus,
    ],
  );

  const SecondRoute = useCallback(
    () => (
      <View style={styles.flex}>
        <SortItem
          label={getString('novelScreen.bottomSheet.order.bySource')}
          status={
            sort === 'positionAsc'
              ? 'asc'
              : sort === 'positionDesc'
              ? 'desc'
              : undefined
          }
          onPress={() =>
            sort === 'positionAsc'
              ? setChapterSort('positionDesc')
              : setChapterSort('positionAsc')
          }
          theme={theme}
        />
        <SortItem
          label={getString('novelScreen.bottomSheet.order.byChapterName')}
          status={
            sort === 'nameAsc'
              ? 'asc'
              : sort === 'nameDesc'
              ? 'desc'
              : undefined
          }
          onPress={() =>
            sort === 'nameAsc'
              ? setChapterSort('nameDesc')
              : setChapterSort('nameAsc')
          }
          theme={theme}
        />
      </View>
    ),
    [sort, setChapterSort, theme],
  );

  const ThirdRoute = useCallback(
    () => (
      <View style={styles.flex}>
        <Checkbox
          status={showChapterTitles ?? true}
          label={getString('novelScreen.bottomSheet.displays.sourceTitle')}
          onPress={() => setShowChapterTitles(true)}
          theme={theme}
        />
        <Checkbox
          status={!showChapterTitles}
          label={getString('novelScreen.bottomSheet.displays.chapterNumber')}
          onPress={() => setShowChapterTitles(false)}
          theme={theme}
        />
      </View>
    ),
    [setShowChapterTitles, showChapterTitles, theme],
  );

  const FourthRoute = useCallback(
    () => (
      <View style={styles.flex}>
        <List.Subheader theme={theme}>Translation</List.Subheader>

        <SwitchItem
          label="Auto-translate chapters"
          value={!!novel?.autoTranslate}
          onPress={() => updateNovel({ autoTranslate: !novel?.autoTranslate })}
          theme={theme}
        />

        {novel?.autoTranslate ? (
          <>
            <List.Item
              title="Translate to"
              description={LANGUAGES.find(l => l.code === novel?.translationLang)?.label || 'Not selected'}
              icon="web"
              onPress={() => setLangVisible(true)}
              theme={theme}
            />
            <List.Item
              title="Translate all downloaded chapters"
              description={
                isAnyTranslating
                  ? 'Translating chapters...'
                  : `${untranslatedCount} chapters not yet translated`
              }
              onPress={() => {
                if (!isAnyTranslating && downloadedChapters.length > 0 && novel) {
                  translateChapters(downloadedChapters, novel);
                }
              }}
              disabled={isAnyTranslating || downloadedChapters.length === 0}
              theme={theme}
              icon="translate"
            />
          </>
        ) : null}
      </View>
    ),
    [
      theme,
      novel,
      updateNovel,
      isAnyTranslating,
      untranslatedCount,
      downloadedChapters,
      translateChapters,
    ],
  );

  const renderScene = SceneMap({
    first: FirstRoute,
    second: SecondRoute,
    third: ThirdRoute,
    fourth: FourthRoute,
  });

  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: getString('common.filter') },
    { key: 'second', title: getString('common.sort') },
    { key: 'third', title: getString('common.display') },
    { key: 'fourth', title: 'Translate' },
  ]);

  const renderTabBar: TabViewProps<any>['renderTabBar'] = props => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: theme.primary }}
      style={[
        {
          backgroundColor: overlay(2, theme.surface),
          borderBottomColor: theme.outline,
        },
        styles.tabBar,
      ]}
      inactiveColor={theme.onSurfaceVariant}
      activeColor={theme.primary}
      pressColor={color(theme.primary).alpha(0.12).string()}
    />
  );

  const renderLabel = useCallback(
    ({ route, color: localColor }: { route: any; color: string }) => {
      return <Text style={{ color: localColor }}>{route.title}</Text>;
    },
    [],
  );

  return (
    <>
      <BottomSheet
        snapPoints={[280]}
        bottomSheetRef={bottomSheetRef}
        backgroundStyle={styles.transparent}
      >
        <BottomSheetView
          style={[
            styles.contentContainer,
            {
              backgroundColor: overlay(2, theme.surface),
              marginLeft: left,
              marginRight: right,
            },
          ]}
        >
          <TabView
            commonOptions={{
              label: renderLabel,
            }}
            navigationState={{ index, routes }}
            renderTabBar={renderTabBar}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: layout.width }}
            style={styles.tabView}
          />
        </BottomSheetView>
      </BottomSheet>
      <LanguagePickerModal
        visible={langVisible}
        onDismiss={() => setLangVisible(false)}
        currentLanguage={novel?.translationLang || ''}
        onSelect={lang => updateNovel({ translationLang: lang })}
        languages={LANGUAGES}
      />
    </>
  );
};

export default ChaptersSettingsSheet;

const styles = StyleSheet.create({
  contentContainer: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    flex: 1,
  },
  tabView: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    height: 280,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  flex: {
    flex: 1,
  },
  tabBar: {
    borderBottomWidth: 1,
    elevation: 0,
  },
});
