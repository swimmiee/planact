import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { DefaultTheme } from '@/style/styled';
import useTheme from '@/modules/theme/hooks';
import EventPreview from './EventPreview';
import { Button, Text, useThemedStepper } from '@components/materials';
import { getMarketScheduleEvents } from '@/api/market/';
import { useUserState } from '@/modules/auth/hooks';
import { IEvent, ISchedule } from '@/utils/data';
import { AxiosError, AxiosResponse } from 'axios';
import {
  NewScheduleComment,
  ScheduleCommentsList,
  useScheduleComments,
} from '@/components/scheduleComments';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface EventsGroupedByDateOf {
  date: string;
  events: IEvent[];
}

export default function MarketScheduleDetails({ route, navigation }) {
  // theme
  const theme = useTheme();
  const { container, header, content, stepperWrapper, item } = useMemo(
    () => styles(theme),
    [theme]
  );

  // Get Detail Data from api
  const { getToken } = useUserState();
  const schedule: ISchedule = route.params.schedule;
  const [schedulePreviewEvents, setSchedulePreviewEvents] = useState<
    EventsGroupedByDateOf[]
  >([]);
  const [stepperSize, setStepperSize] = useState<number>(3);

  // Stepper Setting
  const { StepperGetter, active } = useThemedStepper({ size: stepperSize });
  const Stepper = useMemo(() => StepperGetter(), [stepperSize, active, theme]);

  // Comment
  const { comments, createComment, resetComments } = useScheduleComments(
    schedule.id
  );

  // Initial Setting
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      await getMarketScheduleEvents(token, schedule.id)
        .then((res: AxiosResponse<EventsGroupedByDateOf[]>) => {
          setSchedulePreviewEvents(res.data);
          setStepperSize(Math.min(res.data.length, 5));
        })
        .catch((err: AxiosError) => console.log(err));
    })();
  }, [schedule]);

  const onDownload = () =>
    navigation.push('Market/Schedule/Download', { schedule });
  const Wrapper =
    Platform.OS === 'android' ? KeyboardAwareScrollView : SafeAreaView;
  return (
    <Wrapper style={[container]}>
      <ScrollView style={container}>
        <View style={[item, header]}>
          <View>
            <Text bold headings={1} align="left" content={`${schedule.name}`} />
            <Text
              headings={3}
              align="left"
              marginVertical={10}
              content={schedule.description}
            />
          </View>
        </View>

        {/* Stepper */}
        <View style={stepperWrapper}>{Stepper}</View>
        <View style={content}>
          {schedulePreviewEvents.length ? (
            schedulePreviewEvents[active].events.map((event, idx) => (
              <EventPreview event={event} key={idx} />
            ))
          ) : (
            <></>
          )}
        </View>
        {!schedule.has_attached ? (
          <View style={item}>
            <Button
              color="primary"
              content="내 캘린더에 내려받기"
              onPress={onDownload}
            />
          </View>
        ) : (
          <></>
        )}
        <ScheduleCommentsList
          schedule_id={schedule.id}
          comments={comments}
          resetComments={resetComments}
        />
      </ScrollView>
      <NewScheduleComment
        floorFixed
        createComment={createComment}
        resetComments={resetComments}
        style={{ backgroundColor: 'red' }}
      />
    </Wrapper>
  );
}

const styles = ({ mainBackground }: DefaultTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: mainBackground,
      padding: 20,
    },
    header: {
      justifyContent: 'space-between',
      padding: 12,
      minHeight: 100,
    },
    content: {
      paddingHorizontal: 16,
    },
    stepperWrapper: {
      flex: 1,
      marginBottom: 16,
    },
    item: {
      height: 55,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
