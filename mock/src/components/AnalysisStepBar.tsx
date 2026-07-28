import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { pressFeedback } from '../theme/motion';

export type AnalysisStep = 1 | 2 | 3;

export function AnalysisStepBar({
  current,
  onStepPress,
  embedded,
}: {
  current: AnalysisStep;
  onStepPress?: (step: AnalysisStep) => void;
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const steps = [
    { n: 1 as const, label: t('analysisStep.confirm') },
    { n: 2 as const, label: t('analysisStep.edit') },
    { n: 3 as const, label: t('analysisStep.save') },
  ];

  return (
    <View style={[styles.wrap, embedded && styles.wrapEmbedded]}>
      {steps.map((step, index) => {
        const done = current > step.n;
        const active = current === step.n;
        const canPress = onStepPress && done;

        return (
          <React.Fragment key={step.n}>
            <Pressable
              disabled={!canPress}
              onPress={() => onStepPress?.(step.n)}
              style={({ pressed }) => [
                styles.stepItem,
                embedded && styles.stepItemEmbedded,
                canPress && pressed && pressFeedback(pressed),
              ]}
            >
              <View
                style={[
                  styles.circle,
                  embedded && styles.circleEmbedded,
                  done && styles.circleDone,
                  active && styles.circleActive,
                ]}
              >
                <Text
                  style={[
                    styles.circleText,
                    embedded && styles.circleTextEmbedded,
                    done && styles.circleTextDone,
                    active && styles.circleTextActive,
                  ]}
                >
                  {done ? '✓' : step.n}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  embedded && styles.stepLabelEmbedded,
                  done && styles.stepLabelDone,
                  active && styles.stepLabelActive,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </Pressable>
            {index < steps.length - 1 ? (
              <View
                style={[
                  styles.line,
                  embedded && styles.lineEmbedded,
                  current > step.n && styles.lineDone,
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  wrapEmbedded: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 0,
    minHeight: 44,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },
  stepItem: {
    alignItems: 'center',
    width: 64,
  },
  stepItemEmbedded: {
    width: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleEmbedded: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  circleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  circleDone: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  circleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  circleTextEmbedded: {
    fontSize: 11,
  },
  circleTextDone: {
    color: colors.primary,
  },
  circleTextActive: {
    color: '#fff',
  },
  stepLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    color: colors.inkFaint,
  },
  stepLabelEmbedded: {
    marginTop: 0,
    fontSize: 12,
    fontWeight: '600',
  },
  stepLabelDone: {
    color: colors.primary,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginTop: 14,
    marginHorizontal: 6,
    maxWidth: 48,
  },
  lineEmbedded: {
    marginTop: 0,
    alignSelf: 'center',
    maxWidth: 24,
    minWidth: 12,
  },
  lineDone: {
    backgroundColor: colors.primary,
  },
});
