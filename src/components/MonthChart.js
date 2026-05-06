import { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { useTheme } from '../theme';
import { isScheduledToday, lastNDates, todayKey } from '../storage/habits';

export default function MonthChart({ habits, completions, days = 30, height = 140 }) {
  const { theme } = useTheme();
  const data = useMemo(() => {
    const dates = lastNDates(days);
    return dates.map((d) => {
      let scheduled = 0;
      let done = 0;
      for (const h of habits) {
        if (isScheduledToday(h, d)) {
          scheduled += 1;
          if ((completions[h.id] || []).includes(todayKey(d))) done += 1;
        }
      }
      const rate = scheduled === 0 ? null : done / scheduled;
      return { date: d, rate, scheduled, done };
    });
  }, [habits, completions, days]);

  const width = 320;
  const padding = 6;
  const innerW = width - padding * 2;
  const barGap = 2;
  const barW = (innerW - barGap * (days - 1)) / days;
  const innerH = height - 22;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <Line
          x1={padding}
          y1={innerH}
          x2={width - padding}
          y2={innerH}
          stroke={theme.border}
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const x = padding + i * (barW + barGap);
          if (d.rate === null) {
            return (
              <Rect
                key={i}
                x={x}
                y={innerH - 4}
                width={barW}
                height={4}
                rx={2}
                fill={theme.cardAlt}
              />
            );
          }
          const h = Math.max(3, d.rate * (innerH - 6));
          const fill = d.rate >= 0.99 ? theme.success : d.rate >= 0.5 ? theme.accent : theme.warning;
          return (
            <Rect
              key={i}
              x={x}
              y={innerH - h}
              width={barW}
              height={h}
              rx={Math.min(3, barW / 2)}
              fill={fill}
              opacity={d.rate < 0.2 ? 0.55 : 1}
            />
          );
        })}
      </Svg>
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: theme.textDim }]}>
          {data[0].date.getDate()}.{data[0].date.getMonth() + 1}
        </Text>
        <Text style={[styles.legendText, { color: theme.textDim }]}>
          {data[data.length - 1].date.getDate()}.{data[data.length - 1].date.getMonth() + 1}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 22,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 3,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  legendText: { fontSize: 11, fontWeight: '500' },
});
