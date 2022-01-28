import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { getBottomSpace } from 'react-native-iphone-x-helper';
import { HighlightCard } from '../../components/HighlightCard';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from 'styled-components';
import uuid from 'react-native-uuid';
import { LastTransaction } from '../../components/HighlightCard/styles';
import { useAuth } from '../../hooks/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard';

import { 
        Container,
        Header,
        UserWrapper,
        UserInfo,
        Photo,
        User,
        UserGreeting,
        UserName,
        LogoutButton,
        Icon,
        HighlightCards,
        Transaction,
        Title,
        LoadContainer,
        TransactionList
 } from './styles';


 export interface DataListProps extends TransactionCardProps{
     id: string;
 }

 interface HighlightProps{
     amount: string;
     lastTransaction: string;
 }

 interface HighlightData{
    entries: HighlightProps;
    expensives: HighlightProps;
    total: HighlightProps;
}

export function Dashboard(){   
    const [isLoading, setIsLoading] = useState(true);
    const [transactions, setTransactions] = useState<DataListProps[]>([]);
    const [ highlightData, setHighlightData ] = useState<HighlightData>({} as HighlightData);

    const theme = useTheme();
    const { signOut, user } = useAuth();

    function getLastTransactionDate(
            collection: DataListProps[],
            type: 'positive' | 'negative'
        ){

        const collectionFilltered = collection.filter(transaction => transaction.type === type);

        if(collectionFilltered.length === 0)
        return 0;

        const lastTransaction = new Date(
            Math.max.apply(Math, collectionFilltered
            .map(transaction => new Date(transaction.date).getTime())));
   
            return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', { month: 'long'})}`;
    }

    async function loadTransactions() {
        const datakey = `@app_gofinances:transactions_user:${user.id}`;
        const response = await AsyncStorage.getItem(datakey);
        const transactions = response ? JSON.parse(response) : [];

        let entriesTotal = 0;
        let expensiveTotal = 0;

         const transactionsFormatted: DataListProps[] = transactions.map((item: DataListProps) => {
            
            if(item.type === 'positive'){
                entriesTotal += Number(item.amount);
            }else{
                expensiveTotal += Number(item.amount);
            }
            
            const amount = Number(item.amount)
            .toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            const date = Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            }).format(new Date(item.date));
            

            return {
                id: item.id,
                name: item.name,
                amount,
                type: item.type,
                category: item.category,
                date,
            }
            
        });        

         setTransactions(transactionsFormatted);  
         
         const LastTransactionEntries = getLastTransactionDate(transactions, 'positive');
         const LastTransactionExpensives = getLastTransactionDate(transactions, 'negative');


         const totalInterval = LastTransactionExpensives === 0
         ? 'Não há Transações'
         : `01 a ${LastTransactionExpensives}`;

         const total = entriesTotal - expensiveTotal;
         setHighlightData({
             entries:{
                amount: entriesTotal.toLocaleString('pt-BR',{
                     style: 'currency',
                     currency: 'BRL'
                 }),
                 lastTransaction: LastTransactionEntries === 0 
                 ? `Não há Transações`
                 : `Última entrada dia ${LastTransactionEntries}`,
             },
             expensives:{
                amount: expensiveTotal.toLocaleString('pt-BR',{
                    style: 'currency',
                    currency: 'BRL'
                }),
                lastTransaction: LastTransactionExpensives === 0 
                 ? `Não há Transações`
                 : `Última entrada dia ${LastTransactionExpensives}`,
            },
            total:{
                amount: total.toLocaleString('pt-BR',{
                    style: 'currency',
                    currency: 'BRL'
                }),
                lastTransaction: totalInterval,
            }
         });

         setIsLoading(false);
    }

    useEffect(() => {
        loadTransactions();
    }, []);

    useFocusEffect(useCallback(() => {
        loadTransactions();
    }, []));

    return(
        <Container>            
             {  
             isLoading ? 
                <LoadContainer> 
                    <ActivityIndicator
                        color={theme.colors.primary}
                        size="large"
                    />
                 </LoadContainer> :
              <>
                <Header>
                    <UserWrapper>
                        <UserInfo>
                            <Photo source={ {uri: user.photo}}/>
                            <User>
                                <UserGreeting>Olá,</UserGreeting>
                                <UserName>{user.name} </UserName>
                            </User>
                        </UserInfo> 

                        <LogoutButton onPress={signOut}>
                            <Icon name="power" />   
                        </LogoutButton>               
                    </UserWrapper>             
                </Header>

                <HighlightCards>
                    <HighlightCard type="total" title="Total" amount={highlightData.total.amount} lastTransaction={highlightData.total.lastTransaction} />
                    <HighlightCard type="up" title="Entradas" amount={highlightData.entries.amount} lastTransaction={highlightData.entries.lastTransaction}/>
                    <HighlightCard type="down" title="Saídas" amount={highlightData.expensives.amount} lastTransaction={highlightData.expensives.lastTransaction}/>
                </HighlightCards>

                <Transaction>
                    <Title>Listagem</Title>

                    <TransactionList
                        data={transactions}
                        keyExtractor={ item => item.id}
                        renderItem={({ item }) => <TransactionCard  data={item} />}                        
                    />
                    
                </Transaction>
                </>
            }
        </Container>
    )
}