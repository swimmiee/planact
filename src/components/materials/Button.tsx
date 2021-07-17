
import { GlobalState } from '@modules/index';
import { DefaultTheme } from '@/style/styled';
import React from 'react';
import { StyleSheet, TouchableOpacity, TouchableOpacityProps, Text } from 'react-native'
import { useSelector } from 'react-redux';
import { shadow } from "@modules/theme/hooks"
import { useMemo } from 'react';
import media from '@/style/media';

interface ButtonProps extends TouchableOpacityProps{
    content: string
    color?: "primary" | "secondary" | "ghost"
    flex?: number
}

const Button = function({color, flex, disabled, content, style, ...others}:ButtonProps){
    const theme = useSelector(({theme}:GlobalState) => theme);
    const {container, text} = useMemo(() => styles(theme, color, flex || 0), [color, theme]);
  
    return(
    <TouchableOpacity 
        style={[container, style, {opacity: (disabled ? 0.6 : 1)}]} 
        disabled={disabled} 
        {...others}
    >
        <Text style={text}>
            {content}
        </Text>
    </TouchableOpacity>
  )
}

type ButtonColors =  "primary" | "secondary" | "ghost";
const styles = (theme:DefaultTheme, color?:ButtonColors, flex?:number) => {
    const {main, text, border} = color ? theme[color] : theme.primary;
    return StyleSheet.create({
        container: {
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: main,
            borderColor: border,
            borderWidth: 0,
            borderRadius: 5,
            padding: 10,
            flex: flex,
            ...shadow
        },
        text:{
            ...media.vertical('fontSize', 20, 17),
            color: text
        },

    })
}

export default Button;
