import { Fonts } from './theme';

export const DESIGN_CONSTANTS = {
    MULT_NAME: 8.5,
    MULT_BODY: 12,
    PLATE_PADDING: 28,
    PLATE_WIDTH: '85%',
    PLATE_RADIUS: 20,
};

export const getFontStack = (fontFamily: string, weight: 'Regular' | 'Bold' | 'Italic' = 'Regular') => {
    const stack: any = Fonts;
    const selection = stack[fontFamily] || stack['Playfair'];
    return selection[weight] || selection['Regular'];
};

export const PRESET_FONTS = ["Playfair", "Cormorant", "GreatVibes", "Montserrat", "Roboto"];
