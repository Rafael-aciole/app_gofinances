import React, { useContext, useState } from "react";
import { ActivityIndicator, Alert, Platform } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { useTheme } from "styled-components";

import AppleSvg from '../../assets/apple.svg';
import GoolgeSvg from '../../assets/google.svg';
import LogoSvg from '../../assets/logo.svg';

import { SignInSocialButton } from '../../components/SignInSocialButton';
import { useAuth } from "../../hooks/auth";

import { 
    Container,
    Header,
    TitleWrapper,
    Title,
    SignInTitle,
    Footer,
    FooterWrapper
 } from './styles';

export function SignIn(){
    const [isLoading, setIsLoading] = useState(false);
    const {signInWithGoogle, signInWithApple} = useAuth();
    const theme = useTheme();

    async function handleSignInWithGoogle() {
        try {
            setIsLoading(true);
            return await signInWithGoogle();
        } catch (error) {
            console.log(error);
            Alert.alert('Desculpa mas não foi possível conectar a conta Google');
            setIsLoading(false);
        }
    }

    async function handleSignInWithApple() {
        try {
            setIsLoading(true);
            return await signInWithApple();
        } catch (error) {
            console.log(error);
            Alert.alert('Desculpa mas não foi possível conectar a conta Apple');
            setIsLoading(false);
        }
    }

    return(
        <Container>
            <Header>
                <TitleWrapper>
                    <LogoSvg
                        width={RFValue(120)}
                        hight={RFValue(68)}
                    />

                    <Title>
                        Controle suas {'\n'}
                        finanças de forma {'\n'}
                        muito simples {'\n'}
                    </Title>

                    <SignInTitle>
                        Faça seu login com {'\n'}
                        uma das contas abaixo
                    </SignInTitle>

                </TitleWrapper>
            </Header>

            <Footer>
                <FooterWrapper>
                    <SignInSocialButton 
                        title="Entrar com Google"
                        svg={GoolgeSvg}
                        onPress={handleSignInWithGoogle}
                    />
                    {
                        Platform.OS === 'ios' &&
                        <SignInSocialButton 
                            title="Entrar com Apple"
                            svg={AppleSvg}
                            onPress={handleSignInWithApple}
                    />
                    }
                </FooterWrapper>
                { isLoading && 
                <ActivityIndicator 
                color={theme.colors.shape} 
                style={{ marginTop: 20 }}
                />}
            </Footer>
        </Container>
    );
}