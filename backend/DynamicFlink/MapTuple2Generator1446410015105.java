package DynamicFlink;
import org.apache.flink.api.common.functions.MapFunction;
import DynamicFlink.s1POJO1446410015105;
import DynamicFlink.csv1POJO1446410015105;
import com.WebSocket.EchoWebSocketEndPoint;
import com.google.gson.JsonObject;
import org.apache.flink.api.java.tuple.Tuple2;
public class MapTuple2Generator1446410015105 implements MapFunction<Tuple2<s1POJO1446410015105,csv1POJO1446410015105>, String> {
    private static long startTime;
    private static long endTime;
    private long count;
    public MapTuple2Generator1446410015105(){
        startTime = System.currentTimeMillis();
        count = 0;
    }
    @Override
    public String map(Tuple2<s1POJO1446410015105,csv1POJO1446410015105> obj) throws Exception {
        s1POJO1446410015105 f0 = obj.f0;
        csv1POJO1446410015105 f1 = obj.f1;
        count+=1;
        endTime = System.currentTimeMillis();
        double elapsed_time = endTime - startTime;
        double rate = count/(elapsed_time/1000);
        JsonObject json = new JsonObject();
        json.addProperty("elapsed_time", elapsed_time);
        json.addProperty("processed_tuples", count);
        json.addProperty("rate", rate);
        System.out.println(count);
        EchoWebSocketEndPoint.setJSONToEmit(json);
          return " ";
    }
}
