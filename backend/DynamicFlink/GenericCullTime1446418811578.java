package DynamicFlink;
import DynamicFlink.s1POJO1446418811578;
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.util.Collector;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
public class GenericCullTime1446418811578 implements FlatMapFunction<s1POJO1446418811578,s1POJO1446418811578> {
    protected int numerator;
    protected int denominator;
    protected String timeDataName;
    protected Date startTime;
    protected Date endTime;
    protected int interval;
    protected String timeUnit;
    public GenericCullTime1446418811578(int num, int den, String time_data_name, String start_time, String end_time, int interv, String time_unit){
        numerator = num;
        denominator = den;
        timeDataName = time_data_name;
        interval = interv;
        timeUnit = time_unit;
        DateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm");
        try {
            startTime = formatter.parse(start_time);
            endTime = formatter.parse(end_time);
        } catch (ParseException e) {
            e.printStackTrace();
        }
    }
    public int getNumerator() {
        return numerator;
    }
    public void setNumerator(int p_numerator) {
        numerator = p_numerator;
    }
    public int getDenominator() {
        return denominator;
    }
    public void setDenominator(int p_denominator) {
        denominator = p_denominator;
    }
    public String getTimeDataName() {
        return timeDataName;
    }
    public void setTimeDataName(String timeDataName) {
        this.timeDataName = timeDataName;
    }
    public Date getStartTime() {
        return startTime;
    }
    public void setStartTime(Date p_startTime) {
        startTime = p_startTime;
    }
    public Date getEndTime() {
        return endTime;
    }
    public void setEndTime(Date endTime) {
        this.endTime = endTime;
    }
    public int getInterval() {
        return interval;
    }
    public void setInterval(int interval) {
        this.interval = interval;
    }
    public String getTimeUnit() {
        return timeUnit;
    }
    public void setTimeUnit(String timeUnit) {
        this.timeUnit = timeUnit;
    }
    @Override
    public void flatMap(s1POJO1446418811578 obj, Collector<s1POJO1446418811578> coll){
        DateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ");
        try{
            String timeString = obj.getTime();
            Date time = formatter.parse( timeString );
            if(time.after(startTime) && time.before(endTime)){
                coll.collect(obj);
            }
        } catch(Exception e){
            e.printStackTrace();
        }
    }
}