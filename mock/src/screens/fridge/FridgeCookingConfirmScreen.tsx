import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FridgeStackParamList } from '../../navigation/types';
import { CookingConfirmView } from '../shared/CookingConfirmView';

type Props = NativeStackScreenProps<FridgeStackParamList, 'CookingConfirm'>;

export function FridgeCookingConfirmScreen({ route }: Props) {
  return (
    <CookingConfirmView
      ingredientIds={route.params.ingredientIds}
      ingredientNames={route.params.ingredientNames}
      origin={route.params.origin ?? 'fridge'}
    />
  );
}
