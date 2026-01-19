// This file is for React Native usage only
import React from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface KeyboardAwareLayoutProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function KeyboardAwareLayout({ 
  children, 
  style 
}: KeyboardAwareLayoutProps) {
  return (
    <KeyboardAwareScrollView
      style={[{ flex: 1, backgroundColor: 'white' }, style]}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      enableAutomaticScroll={Platform.OS === 'ios'}
      extraScrollHeight={20}
      extraHeight={20}
      keyboardOpeningTime={250}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </KeyboardAwareScrollView>
  );
} 