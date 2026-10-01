import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface BrandLogoProps {
  size?: number;
  variant?: 'full' | 'icon';
  style?: StyleProp<ImageStyle>;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 32,
  variant = 'full',
  style,
  className,
}) => {
  if (variant === 'icon') {
    return (
      <Image
        source={require('../../assets/icon-dark.png')}
        className={className}
        style={[
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.28),
          },
          style,
        ]}
        resizeMode="contain"
      />
    );
  }

  // Ratio aproximado 4.79 para logo-dark.png horizontal
  const width = Math.round(size * 4.79);
  return (
    <Image
      source={require('../../assets/logo-dark.png')}
      className={className}
      style={[
        {
          height: size,
          width,
        },
        style,
      ]}
      resizeMode="contain"
    />
  );
};
