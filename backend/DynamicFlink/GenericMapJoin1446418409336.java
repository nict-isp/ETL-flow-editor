package DynamicFlink;
import org.apache.flink.api.common.functions.MapFunction;
import DynamicFlink.f1POJO1446418409336;
import DynamicFlink.csv1POJO1446418409336;
import com.WebSocket.EchoWebSocketEndPoint;
import com.google.gson.JsonObject;
import org.apache.flink.api.java.tuple.Tuple2;
public class GenericMapJoin1446418409336 implements MapFunction<Tuple2<f1POJO1446418409336,csv1POJO1446418409336>, String> {
    @Override
    public String map(Tuple2<f1POJO1446418409336,csv1POJO1446418409336> obj) throws Exception {
        f1POJO1446418409336 f0 = obj.f0;
        csv1POJO1446418409336 f1 = obj.f1;
        JsonObject json = new JsonObject();
        return "";
    }
}
