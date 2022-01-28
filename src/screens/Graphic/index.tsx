import React, {useCallback, useEffect, useState} from 'react';
import { ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VictoryPie } from 'victory-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from 'styled-components';
import { HistoryCard } from '../../components/HistoryCard';
import { RFValue } from 'react-native-responsive-fontsize';
import { addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../hooks/auth';
import { useFocusEffect } from '@react-navigation/native';

import { 
    Container,
    Content,
    ChartContainer,
    Header,
    Title,
    MonthSelect,
    MonthSelectButton,
    MonthSelectIcon,
    Month,
    LoadContainer
} from './styles';

import { categories } from '../../../utils/categories';


interface TransactionData{
    type: 'positive' | 'negative';
    name: string;
    amount: string;
    category: string;
    date: string
}

interface CategoryData{
    key: string;
    name: string;
    total: number;
    totalFormatted: string;
    color: string;
    percent: string;
}

export function Graphic(){
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [totalByCategories, setByCategories] = useState<CategoryData[]>([]);
    
    const { user } = useAuth();
    const theme = useTheme();

    function handlDateChange(action: 'next' | 'prev'){
        setIsLoading(true);
        if(action === 'next'){
            setSelectedDate(addMonths(selectedDate, 1));
        }else{
            setSelectedDate(subMonths(selectedDate, 1));
        }
    }

    async function loadData() {  
        setIsLoading(true);      
        const dataKey = `@app_gofinances:transactions_user:${user.id}`;
        const response = await AsyncStorage.getItem(dataKey);
        const respondeFormatted = response ? JSON.parse(response) : [];

        const expensives = respondeFormatted
        .filter((expensive: TransactionData) => 
        expensive.type === 'negative' &&
        new Date(expensive.date).getMonth() === selectedDate.getMonth() &&
        new Date(expensive.date).getFullYear() === selectedDate.getFullYear()
        );

        const expensiveTotal = expensives
        .reduce((acumullator: number, expensives:TransactionData) => {
            return acumullator + Number(expensives.amount);
        }, 0);

        const totalByCategory: CategoryData[] = [];

        categories.forEach(category => {
            let categorySum = 0;

            expensives.forEach((expensives: TransactionData) => {
                if(expensives.category === category.key){
                    categorySum += Number(expensives.amount);
                }
            });

            if(categorySum > 0){
                const totalFormatted = categorySum
                .toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                })

                const percent = `${(categorySum / expensiveTotal * 100).toFixed(0)}%`;

                totalByCategory.push({
                    key: category.key,
                    name: category.name,
                    color: category.color,
                    total: categorySum,
                    totalFormatted,
                    percent
                });
            }
        });

        setByCategories(totalByCategory);
        setIsLoading(false);
    }    

    useFocusEffect(useCallback(() => {
        loadData();
    }, [selectedDate]));

    return (        
        <Container>
            <Header>
                <Title>Resumo por Categoria</Title>
            </Header>
            {
            isLoading ? 
                <LoadContainer> 
                    <ActivityIndicator
                        color={theme.colors.primary}
                        size="large"
                    />
                 </LoadContainer> :

            <Content 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 24,
                    paddingBottom: useBottomTabBarHeight(),
                }}       
            >

                <MonthSelect>
                    <MonthSelectButton onPress={() => handlDateChange('prev')}>
                        <MonthSelectIcon name="chevron-left" />
                    </MonthSelectButton>

                    <Month>{ format(selectedDate, 'MMMM, yyyy', {locale: ptBR}) }</Month>

                    <MonthSelectButton onPress={() => handlDateChange('next')}>
                        <MonthSelectIcon name="chevron-right" />
                    </MonthSelectButton>
                </MonthSelect>

            <ChartContainer>
                <VictoryPie
                    data={totalByCategories}
                    colorScale={totalByCategories.map(category => category.color)}
                    style={{
                        labels:{
                            fontSize: RFValue(18),
                            fontWeight: 'bold',
                            fill: theme.colors.shape
                        }
                    }}
                    labelRadius={50}
                    x="percent"
                    y="total"
                />
            </ChartContainer>
            
                {
                    totalByCategories.map(item => (
                        <HistoryCard 
                            key={item.key}
                            title={item.name}
                            amount={item.totalFormatted}
                            color = {item.color}
                        />
                    ))
                }
            </Content>
        }
        </Container>
    )
}