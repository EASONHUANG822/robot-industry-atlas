import {
  DETAIL_SCROLL_STEP_THRESHOLDS,
  getActiveDetailStepIndex,
} from "./detailScrollSteps";

function expectActiveStep(progress: number, expectedIndex: number) {
  const actualIndex = getActiveDetailStepIndex(progress, DETAIL_SCROLL_STEP_THRESHOLDS);

  if (actualIndex !== expectedIndex) {
    throw new Error(
      `Expected progress ${progress} to activate step ${expectedIndex}, got ${actualIndex}.`,
    );
  }
}

expectActiveStep(-1, 0);
expectActiveStep(0, 0);
expectActiveStep(0.179, 0);
expectActiveStep(0.18, 1);
expectActiveStep(0.4, 1);
expectActiveStep(0.479, 1);
expectActiveStep(0.48, 2);
expectActiveStep(0.6, 2);
expectActiveStep(0.719, 2);
expectActiveStep(0.72, 3);
expectActiveStep(0.84, 3);
expectActiveStep(1, 3);
expectActiveStep(2, 3);
