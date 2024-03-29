import useTheme from "@/modules/theme/hooks";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Dimensions,StyleSheet, View } from "react-native";
import { Button, GaugeBar, Text } from "@components/materials"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { IUserSchedule } from "@/utils/data";
import { ScrollView } from "react-native-gesture-handler";
import { DefaultTheme } from "@/style/styled";
import { useDailyList } from "@/modules/userDailyList/hooks";
import dayjs from "dayjs";
import { LineChart } from "react-native-chart-kit";
import media from "@/style/media";
import {deleteUserSchedule, deleteUserScheduleAfter} from "@/api/profile/deleteUserSchedule";
import { useUserState } from "@/modules/auth/hooks";
import { useUserSchedule } from "@/modules/userSchedule/hooks";
import { NewScheduleComment, ScheduleCommentsList, useScheduleComments } from "@/components/scheduleComments";

type RouteParams = {
    Detail: {
        user_schedule: IUserSchedule
    };
}
export default function () {
    const { getToken } = useUserState();
    const { fetchUserSchedule } = useUserSchedule()
    const { initialDailyFetch } = useDailyList()

    // Route Settings
    const {params:{user_schedule}} = useRoute<RouteProp<RouteParams, 'Detail'>>()
    const navigation = useNavigation()
    useEffect(() => {
        navigation.setOptions({title: user_schedule.alias})
    },[user_schedule.id])
    
    // Comments
    const {comments, resetComments, createComment, deleteComment} = useScheduleComments(user_schedule.schedule.id);
    useEffect(() => {
        getToken().then(token =>{
            if(token)
                resetComments(token)
        });
      }, [user_schedule.schedule.id]);
    // Style Settings
    const theme = useTheme()
    const {wrapper, menu, padding, chartContainer} = useMemo(() => styles(theme), [theme]);

    // Get Daily Events
    const {dailys} = useDailyList();
    const today = dayjs();
    const latest = useMemo(() =>  dailys.filter(
            daily => today.diff(daily.date, 'hours') > 0
        )
        .map(
            daily => {
                const proofs = daily.events.filter(
                        userevent => userevent.event.schedule === user_schedule.schedule.id
                    ).map(event => event.proof)
                return {
                    date: daily.date,
                    score: proofs.map(Boolean).map(Number).reduce((a,b)=>a+b, 0),
                    count: proofs.length,
               }
            }
        ).filter(daily => daily.count),
        [user_schedule.schedule.id, user_schedule.achievement]
    )

    const onDelete = (all:boolean) => () => {
        Alert.alert(
            (all?
                '플랜을 정말 삭제하겠습니까? 삭제된 플랜은 복구되지 않습니다.'
                :
                `${user_schedule.alias}의 모든 이후 일정을 삭제하시겠습니까?`
            ),
            '',
            [
                {
                  text: "취소",
                  style: "cancel"
                },
                { 
                    text: "네", 
                    onPress: 
                    () =>  getToken()
                        .then((token) => {
                            if(!token)
                                throw Error
                            all ?
                                deleteUserSchedule(token, user_schedule.id)
                                :
                                deleteUserScheduleAfter(token, user_schedule.id)
                            return token
                        }).then((token) => {
                            Alert.alert('플랜이 삭제되었습니다.');
                            fetchUserSchedule(token); 
                            initialDailyFetch(token);
                            navigation.navigate('Profile');
                        })
                },
            ])
    }

    const [dangerVisible, setDangerVisible] = useState<boolean>(false)
    const toggleDangerVisible = () => setDangerVisible(prev => !prev)

    return(
        <KeyboardAwareScrollView style={{flex:1, marginBottom:0}}>
            <ScrollView style={wrapper}>
                {/* 성취율 */}
                <View style={padding}>
                    <Text
                        align="left"
                        bold
                        headings={1}
                        content="플랜 성취율"
                        marginBottom={10}
                    />
                    <GaugeBar 
                        num={
                            (user_schedule?.achievement || 0)
                        }
                        denom={(user_schedule?.schedule.count_events || 1)} />
                </View>
                
                {/* 성취율 그래프 */}
                {latest.length ?
                <View style={chartContainer} >
                    <LineChart 
                        data={{
                            labels:latest.map(daily => daily.date.format('M/D')),
                            datasets:[{
                                data: latest.map(daily => 100* daily.score / daily.count)
                            }]
                        }}
                        width={Dimensions.get('screen').width*0.95}
                        height={220}
                        chartConfig={{
                            backgroundColor:theme.primary.main,
                            backgroundGradientFrom: theme.primary.main,
                            backgroundGradientFromOpacity: 1,
                            backgroundGradientTo: theme.primary.main,
                            backgroundGradientToOpacity: 0.85,
                            decimalPlaces: 0, // optional, defaults to 2dp
                            color: (opacity = 1) => (
                                theme.primary.text
                            ),
                            propsForLabels:{
                                ...media.vertical('fontSize', 15, 14),
                            }
                        }}
                        yAxisSuffix="%"
                        yLabelsOffset={12}
                        withInnerLines={false}
                        bezier
                        fromZero
                        style={{
                            borderRadius: 16,
                        }}
                    />
                </View>
                :
                <>
                <Text 
                    marginTop={70}
                    content="아직 성취한 플랜이 없습니다." 
                />
                <Text
                    marginVertical={10}
                    content="플랜 진행이 시작되면 성취도 분석을 제공합니다." 
                />
                <Text
                    marginBottom={70}
                    content="플랜 종류에 따라 분석이 제공되지 않을 수 있습니다." 
                />
                </>
                }

                
                
            {/* 댓글  */}
                <ScheduleCommentsList
                    style={{padding:10}}
                    schedule_id={user_schedule.schedule.id}
                    count_events={user_schedule?.schedule.count_events || 1}
                    comments={comments}
                    deleteComment={deleteComment}
                />

                <NewScheduleComment
                    style={{padding:10}}
                    createComment={createComment}
                />


                <Button 
                    color="danger"
                    content="Danger Zone"
                    style={{marginTop:40, marginBottom:20}}
                    onPress={toggleDangerVisible}
                />{
                    dangerVisible && (
                        <>
                <View style={menu}>
                    <View style={{flex: 5}}>
                        <Text
                            bold
                            align="left"
                            headings={2}
                            content="남은 일정 삭제하기"
                        />
                        <Text
                            align="left"
                            headings={3}
                            marginTop={3}
                            content="앞으로 남은 일정이 삭제됩니다. "
                        />
                    </View>
                    <Button
                        flex={2}
                        content="삭제" 
                        color="danger" 
                        onPress={onDelete(false)}
                    />
                </View>
                <View style={menu}>
                    <View style={{flex: 5}}>
                        <Text
                            bold
                            align="left"
                            headings={2}
                            content="플랜 삭제하기"
                        />
                        <Text
                            align="left"
                            headings={3}
                            marginTop={3}
                            content="플랜 정보가 모두 삭제됩니다. "
                        />
                    </View>
                    <Button
                        flex={2}
                        content="삭제" 
                        color="danger"
                        onPress={onDelete(true)}
                    />
                </View>
                </>
                )}
            </ScrollView>
        </KeyboardAwareScrollView>
    )
}

const styles = ({mainBackground}:DefaultTheme) => {
    return StyleSheet.create({
        wrapper: {
            flex:1,
            backgroundColor: mainBackground
        },
        padding:{
            padding: 12
        },
        menu: {
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            paddingHorizontal: 20,
        },
        chartContainer:{
            flex: 1,
            width: "100%",
            alignItems:"center",
            justifyContent:"center",
            paddingVertical: 10
        }
    })
}