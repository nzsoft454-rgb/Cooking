import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { CameraStackParamList } from '../../navigation/types';
import { CookingConfirmView } from '../shared/CookingConfirmView';

type Props = NativeStackScreenProps<CameraStackParamList, 'CookingConfirm'>;

export function CookingConfirmScreen({ route }: Props) {
  return (
    <CookingConfirmView
      ingredientIds={route.params.ingredientIds}
      ingredientNames={route.params.ingredientNames}
    />
  );
}
