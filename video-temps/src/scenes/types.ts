import {SceneTiming} from '../timing';

export type SceneProps = {
	/** Temps écoulé depuis le début de la scène (s). */
	t: number;
	/** Instant où la voix off prononce un mot donné (voir wordTimer). */
	w: (word: string, n?: number) => number;
	s: SceneTiming;
};
