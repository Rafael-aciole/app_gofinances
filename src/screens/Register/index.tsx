import React, {useEffect, useState} from 'react';
import { Keyboard, Modal, TouchableWithoutFeedback, Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/auth';
import uuid from 'react-native-uuid';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { InputForm } from '../../components/Form/InputForm'; 
import { Button } from '../../components/Form/Button'; 
import { TransactionTypeButton } from '../../components/Form/TransactionTypeButton'; 
import { CategorySelectButton } from '../../components/Form/CategorySelectButton/index'; 

import { CategorySelect } from '../CategorySelect/Index';

import { 
    Container,
    Header,
    Title,
    Form,
    Fields,
    TransactionTypes
} from './styles';


interface FormData{
    name: string;
    amount: string;
}

const schema = Yup.object().shape({
    name: Yup
    .string()
    .required('Desculpa, mas o campo nome é obrigatório'),
    amount: Yup
    .number()
    .typeError('Desculpa, informe um valor númerico no preço')
    .positive('Desculpa, mas o valor de preço, não pode ser negativo')
    .required('Desculpa, mas o campo valor é obrigatório'),
});

export function Register(){    
    const [transactionType, setTransactionType] = useState('');
    const [categoryModalOpen, setCategoryOpen] = useState(false);

    const { user } = useAuth();

    const dataKey = `@app_gofinances:transactions_user:${user.id}`;

    const [category, setCategory] = useState({
        key: 'category',
        name: 'Categoria'
    });

    const navigation = useNavigation();

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(schema)
    });

    function handleTransactionTypeSelect(type: 'positive' | 'negative'){
        setTransactionType(type);
    }

    function handleOpenSelectCategoryModal(){
        setCategoryOpen(true);
    }

    function handleCloseSelectCategoryModal(){
        setCategoryOpen(false);
    }

    async function handleRegister(form: FormData){
        if(!transactionType)
            return Alert.alert('Selecione o tipo da transação');
        
        if(category.key === 'category')
            return Alert.alert('Selecione a Categoria');

        const newTransaction = {
            id: String(uuid.v4()),
            name: form.name,
            amount: form.amount,
            type: transactionType,
            category: category.key,
            date: new Date()
        }

        try {   
            const data = await AsyncStorage.getItem(dataKey);
            const currentData = data ? JSON.parse(data) : [];
            
            const dataFormatted = [
                ...currentData,
                newTransaction
            ]

            await AsyncStorage.setItem(dataKey, JSON.stringify(dataFormatted));

            reset();
            setTransactionType('');
            setCategory({
                key: 'category',
                name: 'Categoria'
            });

            navigation.navigate('Listagem');

        } catch (error) {
            console.log(error);
            Alert.alert("Não foi possível salvar");
        }
    } 
    

    return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Container>
            <Header>
                <Title>Cadastro</Title>
            </Header>

            <Form>
                <Fields>
                    <InputForm 
                        control={control} 
                        name="name" 
                        placeholder="Nome"
                        autoCapitalize="sentences"
                        autoCorrect={false}
                        error={errors.name && errors.name.message}
                    />

                    <InputForm 
                        control={control} 
                        name="amount" 
                        placeholder="Preço" 
                        keyboardType="numeric"
                        error={errors.amount && errors.amount.message}
                    />

                    <TransactionTypes>
                        <TransactionTypeButton 
                            type="up" 
                            title="Entrada" 
                            onPress={() => handleTransactionTypeSelect('positive')} 
                            isActive={transactionType === 'positive'}
                        />

                        <TransactionTypeButton 
                            type="down" 
                            title="Saída" 
                            onPress={() => handleTransactionTypeSelect('negative')} 
                            isActive={transactionType === 'negative'}
                        />
                    </TransactionTypes>

                    <CategorySelectButton 
                        title={category.name} 
                        onPress={handleOpenSelectCategoryModal}
                    />
                </Fields>

                

                <Button 
                    title="Enviar"
                    onPress={handleSubmit(handleRegister)}
                />   
            </Form>

            <Modal visible={categoryModalOpen}>
                <CategorySelect 
                    category={category}
                    setCategory={setCategory}
                    closeSelectCategory={handleCloseSelectCategoryModal}
                />
            </Modal>
        </Container>
    </TouchableWithoutFeedback>
    );
};