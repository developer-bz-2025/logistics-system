import type * as React from 'react';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { /** primary: burgundy fill (hover burgundy-dark). secondary: outline. inverse: white fill, for burgundy panels. compact: the header Donate size. hero: white uppercase pill-ish button on hero photos. */ variant?: 'primary' | 'secondary' | 'inverse' | 'compact' | 'hero' }
export declare function Button(props: ButtonProps): React.ReactElement;
export interface LogoProps { /** Lockup. Default horizontal. */ layout?: 'horizontal' | 'vertical' | 'mark'; /** Ground the logo sits on: light = coloured logo, dark = white logo. Default light. */ on?: 'light' | 'dark'; /** CSS height, e.g. 48 or '4rem'. */ height?: number | string; alt?: string; /** Override the image URL when used outside this system. */ src?: string; className?: string }
export declare function Logo(props: LogoProps): React.ReactElement;
export interface SectionRailProps { /** The section name shown rotated on the left rail. */ label: string; children?: React.ReactNode; className?: string }
export declare function SectionRail(props: SectionRailProps): React.ReactElement;
export interface NoteProps { /** Optional lead-in, e.g. "Logo Placement:". */ title?: string; children?: React.ReactNode; className?: string }
export declare function Note(props: NoteProps): React.ReactElement;
export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> { /** Visible label above the field. */ label?: string }
export declare function TextField(props: TextFieldProps): React.ReactElement;
declare global { interface Window { BZ: { Button: typeof Button; Logo: typeof Logo; SectionRail: typeof SectionRail; Note: typeof Note; TextField: typeof TextField } } }
