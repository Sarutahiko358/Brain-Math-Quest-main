import React from 'react';
import { T } from '../../lib/world/areas';
import { useGameState, useGameActions } from '../contexts/GameContext';
import TitleScene from '../scenes/TitleScene';
import BattleSceneView from '../scenes/BattleSceneView';
import BrainOnlySceneView from '../scenes/BrainOnlySceneView';
import ResultView from '../../components/ResultView';
import MapInfoPanel from './MapInfoPanel';
import MapGrid from './MapGrid';
import StatusBar from '../../components/StatusBar';
import MapPadOverlay from './MapPadOverlay';
import LibraryBossBattleView from './LibraryBossBattleView';

interface SceneRendererProps {
  // Refs (cannot be put in Context for performance reasons)
  topStatusDetailRef: React.RefObject<HTMLDivElement | null>;
  padWrapRef: React.RefObject<HTMLDivElement | null>;
  enemyPanelRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Renders the appropriate scene based on the current scene state
 * Uses Context API to eliminate props drilling (reduced from 88 props to 3 refs)
 */
export default function SceneRenderer({
  topStatusDetailRef,
  padWrapRef,
  enemyPanelRef
}: SceneRendererProps) {
  // Get state and actions from Context
  const {
    scene,
    gameMode,
    player,
    battle,
    battleAnim,
    enemyImageError,
    battlePanelBgStyle,
    currentMap,
    currentAreaInfo,
    currentDex,
    areaBannerState,
    settings,
    quizCombo,
    topStatusExpanded,
    padObscuredComputed,
    padHasDragged,
    dojoMode,
    toasts,
    brainEnemy,
    brainEnemyAnim,
    brainOnlyStats,
    brainOnlyQuiz,
    brainOnlyMode,
    showBrainOnlyConfig,
  } = useGameState();

  const {
    showConfirm,
    resetAll,
    setGameMode,
    setScene,
    addToast,
    setBrainOnlyDraft,
    setShowBrainOnlySetup,
    setShowSaveMenu,
    setShowSettings,
    setShowHowto,
    setTopStatusExpanded,
    setPadHasDragged,
    setSettings,
    tryMove,
    setShowMenu,
    setEnemyImageError,
    handleQuizResultLocal,
    setBattle,
    doAttack,
    doRun,
    activateSkillOrMagic,
    handleUseItem,
    advanceLog,
    setPlayer,
    doLoad,
    setShowDex,
    setShowDojo,
    startEncounter,
    setDojoMode,
    handleBrainOnlyResultLocal,
    setBrainOnlyQuiz,
    setShowBrainOnlyResult,
    onLogClick,
  } = useGameActions();

  if (scene === "title") {
    return (
      <TitleScene
        showConfirm={showConfirm}
        resetAll={resetAll}
        setGameMode={setGameMode}
        setScene={setScene}
        addToast={addToast}
        setBrainOnlyDraft={setBrainOnlyDraft}
        setShowBrainOnlySetup={setShowBrainOnlySetup}
        setShowSaveMenu={setShowSaveMenu}
        setShowSettings={setShowSettings}
        setShowHowto={setShowHowto}
        settings={settings}
      />
    );
  }

  if (scene === "map") {
    return (
      <div className="mapView">
        <MapInfoPanel
          currentAreaInfo={currentAreaInfo}
          gameMode={gameMode}
          playerFloor={player.endlessFloor}
          areaBannerState={areaBannerState}
        />
        <MapGrid
          currentMap={currentMap}
          player={player}
          settings={{ tileSize: settings.tileSize }}
          currentAreaInfo={currentAreaInfo}
          currentDex={currentDex}
        />
        <div className="toasts">
          {toasts.map((t, i) => <div key={i} className="toast">{t}</div>)}
        </div>
        <StatusBar
          player={player}
          quizCombo={quizCombo}
          expanded={topStatusExpanded}
          onToggleExpanded={() => setTopStatusExpanded(v => !v)}
          statusOpacity={settings.statusOverlay.opacity}
          statusSize={settings.statusOverlay.size}
          detailRef={topStatusDetailRef as React.RefObject<HTMLDivElement>}
        />
        <MapPadOverlay
          settings={settings}
          padWrapRef={padWrapRef}
          padObscuredComputed={padObscuredComputed}
          padHasDragged={padHasDragged}
          scene={scene}
          setPadHasDragged={setPadHasDragged}
          setSettings={setSettings}
          tryMove={tryMove}
          setShowMenu={setShowMenu}
        />
      </div>
    );
  }

  if (scene === "battle" && battle) {
    const isLibraryBoss = gameMode === 'library' && battle.enemy.boss && battle.enemy.name === currentAreaInfo.bossName;
    if (isLibraryBoss) {
      return (
        <LibraryBossBattleView
          battle={battle}
          player={player}
          settings={settings}
          battleAnim={battleAnim}
          enemyImageError={enemyImageError}
          battlePanelBgStyle={battlePanelBgStyle}
          enemyPanelRef={enemyPanelRef as React.RefObject<HTMLDivElement>}
          onLogClick={onLogClick}
          onEnemyImageError={() => setEnemyImageError(true)}
          handleQuizResult={handleQuizResultLocal}
          setBattle={setBattle}
          doAttack={doAttack}
          doRun={doRun}
        />
      );
    }
    return (
      <BattleSceneView
        battle={battle}
        player={player}
        settings={settings}
        battleAnim={battleAnim}
        enemyImageError={enemyImageError}
        battlePanelBgStyle={battlePanelBgStyle}
        enemyPanelRef={enemyPanelRef as React.RefObject<HTMLDivElement>}
        onLogClick={onLogClick}
        onEnemyImageError={() => setEnemyImageError(true)}
        handleQuizResult={handleQuizResultLocal}
        setBattle={setBattle}
        doAttack={doAttack}
        doRun={doRun}
        activateSkillOrMagic={activateSkillOrMagic}
        handleUseItem={handleUseItem}
        advanceLog={advanceLog}
      />
    );
  }

  if (scene === "result") {
    return (
      <ResultView
        player={player}
        battle={battle}
        dojoMode={dojoMode}
        currentAreaInfo={currentAreaInfo}
        onRestartFromTown={() => {
          setPlayer(p => ({
            ...p,
            hp: Math.floor(p.maxHP / 2),
            mp: Math.floor(p.maxMP / 2),
            gold: Math.floor(p.gold * 0.7),
            pos: currentAreaInfo.startPos
          }));
          setBattle(null);
          setScene("map");
          addToast("💫 町の宿屋で目が覚めた...");
        }}
        onLoadFromSave={doLoad}
        onGoToTitle={() => { resetAll(); setScene("title"); }}
        onContinueAdventure={() => { setScene("map"); setBattle(null); }}
        onShowBestiary={() => { setShowDex(true); }}
        onAnotherBattle={() => { startEncounter(T.Grass); }}
        onExitDojo={() => { setDojoMode(null); setScene("map"); setBattle(null); }}
        onReturnToDojo={() => {
          setBattle(null);
          setScene("map");
          setShowDojo(true);
        }}
      />
    );
  }

  if (scene === "brainOnly") {
    return (
      <BrainOnlySceneView
        brainEnemy={brainEnemy}
        brainEnemyAnim={brainEnemyAnim}
        battlePanelBgStyle={battlePanelBgStyle}
        brainOnlyStats={brainOnlyStats}
        brainOnlyQuiz={brainOnlyQuiz}
        handleBrainOnlyResultLocal={handleBrainOnlyResultLocal}
        setScene={setScene}
        setBrainOnlyQuiz={setBrainOnlyQuiz}
        settings={settings}
        brainOnlyMode={brainOnlyMode}
        setShowBrainOnlyResult={setShowBrainOnlyResult}
        showBrainOnlyConfig={showBrainOnlyConfig}
      />
    );
  }

  return null;
}
