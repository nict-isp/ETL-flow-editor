package DynamicFlink;
import DynamicFlink.s1POJO1449717576600;
import org.apache.flink.api.common.functions.MapFunction;
import com.WebSocket.EchoWebSocketEndPoint;
import com.google.gson.JsonObject;
public class GenericMapper1449717576600 implements MapFunction<s1POJO1449717576600, String> {
    private String sourceID;
    private static long startTime;
    private static long endTime;
    private long ds_size;
    private long count;
    public GenericMapper1449717576600(String source_id, long size){
        sourceID = source_id;
        startTime = System.currentTimeMillis();
        ds_size = size;
         count = 0;
    }
    @Override
    public String map(s1POJO1449717576600 obj) throws Exception {
        count+=1;
        endTime = System.currentTimeMillis();
        double elapsed_time = endTime - startTime;
        double rate = count/(elapsed_time/1000);
        JsonObject json = new JsonObject();
        json.addProperty("source_id", sourceID);
        json.addProperty("elapsed_time", elapsed_time);
        json.addProperty("processed_tuples", count);
        json.addProperty("ds_size", ds_size);
        json.addProperty("rate", rate);
        if(count==ds_size){
            json.addProperty("stopWS", true);
            EchoWebSocketEndPoint.setJSONToEmit(json);
            double d_seconds = elapsed_time/1000;
            return "TEMPO IMPIEGATO => " + elapsed_time + "(millis) " + d_seconds + " secondi" + " | count =>" + count;
        }
        EchoWebSocketEndPoint.setJSONToEmit(json);
        return " " + count;
    }
}