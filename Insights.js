import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { auth, Firebase_DB } from '../../../services/FirebaseConfig';
import { collection, doc, getDocs } from 'firebase/firestore';
import { toDate,startOfWeek,endOfWeek, addDays} from 'date-fns';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Button } from 'react-native-paper';
import { BarChart, Grid, XAxis, YAxis } from 'react-native-svg-charts';


function getWeekRange(date, weekStartsOn = 0) {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0); // Normalize the date to start of the day
    const dayOfWeek = selectedDate.getDay();

    const diffToStart = (dayOfWeek < weekStartsOn) 
                 ? -7 + weekStartsOn - dayOfWeek 
                 : weekStartsOn - dayOfWeek;

    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() + diffToStart);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Ensure the end of the week is the end of the day
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
}

function filterDocsInWeek(docs, date) {
    const { startOfWeek, endOfWeek } = getWeekRange(date, 1);

    return docs.filter(doc => {
        return new Date(doc.timestamp) >= startOfWeek && new Date(doc.timestamp) <= endOfWeek;
    });
}

const handleConfirmDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString(undefined, options);
    setSelectedDate(formattedDate);
    hideDatePicker();
  };


const Insights = () => {
    const [analysisHistory, setAnalysisHistory] = useState(null);
    const [date,setDate]= useState(toDate(new Date("2023-10-17")));
    const startDate = startOfWeek(date, { weekStartsOn: 1 });
    const endDate = endOfWeek(date, { weekStartsOn: 1 });
    const [gData,setgData]= useState([]);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  var [showCal,setShowCal]=useState(false)
    const LEVELS = {
        'Normal': 1,
        'Mild': 2,
        'Moderate': 3,
        'Severe': 4,
    };
    const [xData, setxData]= useState([]);
    const [barData, setbarData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const userId = auth.currentUser?.uid;
            if (userId) {
                const data = await fetchAnalysisHistoryForUser(userId);
                setAnalysisHistory(data);
            }
            const filteredDocs = filterDocsInWeek(analysisHistory, date);
            setgData(filteredDocs);
    
            const { startOfWeek, endOfWeek } = getWeekRange(date, 1);
            var tempX= []
            var current=startOfWeek
            for (let i=0; i<6;i++){
                tempX.push(new Date(current))
                current=addDays(current,1)
            }
            tempX.push(new Date(endOfWeek))
            setxData(tempX.map(x=>x.getDate()+"/"+ x.getMonth()+"/"+ x.getFullYear().toString().substring(2)))
            var tempBar = []
            for(var i=0 ; i<7; i++){tempBar.push(0)}
            filteredDocs.forEach(x=>{
                let d1=toDate(new Date(x.timestamp))
                tempBar[d1.getDay()==0?6:d1.getDay()-1]=LEVELS[x.depression_level]
             })
             setbarData(tempBar)



    };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            const userId = auth.currentUser?.uid;
            if (userId) {
                const data = await fetchAnalysisHistoryForUser(userId);
                setAnalysisHistory(data);
            }
            const filteredDocs = filterDocsInWeek(analysisHistory, date);
            setgData(filteredDocs);
        
            const { startOfWeek, endOfWeek } = getWeekRange(date, 1);
            var tempX= []
            var current=startOfWeek
            for (let i=0; i<6;i++){
                tempX.push(new Date(current))
                current=addDays(current,1)
            }
            tempX.push(new Date(endOfWeek))
            setxData(tempX.map(x=>x.getDate()+"/"+ x.getMonth()+"/"+ x.getFullYear().toString().substring(2)))
            var tempBar = []
            for(var i=0 ; i<7; i++){tempBar.push(0)}
            filteredDocs.forEach(x=>{
                let d1=toDate(new Date(x.timestamp))
                tempBar[d1.getDay()==0?6:d1.getDay()-1]=LEVELS[x.depression_level]
             })
             setbarData(tempBar)
    };

        fetchData();
    }, [date]);

    async function fetchAnalysisHistoryForUser(userId) {
        const userRef = doc(Firebase_DB, 'users', userId);
        const analysisHistoryRef = collection(userRef, 'analysis_history');

        const snapshot = await getDocs(analysisHistoryRef);
        const data = [];

        snapshot.forEach((doc) => {
            data.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return data;
    }

    if (!analysisHistory) {
        return <Text>Loading...</Text>;
    }

   
    return (
        <ScrollView contentContainerStyle={styles.container}>
        
            <Button onPress={()=>{setShowCal(true)}} >cal</Button>
          <DateTimePickerModal
        isVisible={showCal}
        mode="date"
        onConfirm={(d)=>{
            setDate(new Date(d)); setShowCal(false);}}
        onCancel={()=>{setShowCal(false)}}
      />  
       <View style={{ flexDirection: 'row', height: 300, paddingVertical: 16 }}>
                <YAxis
                    data={[0,1, 2, 3, 4]}
                    contentInset={{ top: 10, bottom: 10 }}
                    svg={{ fontSize: 10, fill: 'grey' }}
                    labelStyle={{ color: 'black' }}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <BarChart
                        style={{ flex: 1 }}
                        data={barData}
                        contentInset={{ top: 10, bottom: 10 }}
                        spacing={0.2}
                        gridMin={0}
                        svg={{ fill: 'rgba(134, 65, 244, 0.8)' }}
                    >
                        <Grid />
                    </BarChart>
                    <XAxis
                        style={{ marginHorizontal: -10, paddingTop: 10 }}
                        data={xData}
                        formatLabel={(value, index) => xData[index]}
                        contentInset={{ left: 25, right: 25 }}
                        svg={{ fontSize: 10, fill: 'black' }}
                    />
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    item: {
        marginVertical: 10,
        padding: 15,
        borderWidth: 1,
        borderRadius: 5,
        alignSelf: 'stretch',
        backgroundColor: '#f9f9f9'
    },
    text: {
        color: 'black'
    }
});

export default Insights;