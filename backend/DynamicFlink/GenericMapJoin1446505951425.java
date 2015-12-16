package DynamicFlink;
import org.apache.flink.api.common.functions.MapFunction;
import DynamicFlink.s1POJO1446505951425;
import DynamicFlink.csv1POJO1446505951425;
import com.WebSocket.EchoWebSocketEndPoint;
import com.google.gson.JsonObject;
import org.apache.flink.api.java.tuple.Tuple2;
public class GenericMapJoin1446505951425 implements MapFunction<Tuple2<s1POJO1446505951425,csv1POJO1446505951425>, String> {
    @Override
    public String map(Tuple2<s1POJO1446505951425,csv1POJO1446505951425> obj) throws Exception {
        s1POJO1446505951425 f0 = obj.f0;
        csv1POJO1446505951425 f1 = obj.f1;
        JsonObject json = new JsonObject();
        json.addProperty("latitude", f0.getLatitude().toString());
        json.addProperty("longitude", f0.getLongitude().toString());
        json.addProperty("latitude", f1.getLatitude().toString());
        json.addProperty("longitude", f1.getLongitude().toString());
        return "";
    }
}
