package DynamicFlink;
import org.apache.flink.api.common.functions.MapFunction;
import DynamicFlink.f2POJO1446417984241;
import DynamicFlink.csv1POJO1446417984241;
import com.WebSocket.EchoWebSocketEndPoint;
import com.google.gson.JsonObject;
import org.apache.flink.api.java.tuple.Tuple2;
public class GenericMapJoin1446417984241 implements MapFunction<Tuple2<f2POJO1446417984241,csv1POJO1446417984241>, String> {
    @Override
    public String map(Tuple2<f2POJO1446417984241,csv1POJO1446417984241> obj) throws Exception {
        f2POJO1446417984241 f0 = obj.f0;
        csv1POJO1446417984241 f1 = obj.f1;
        JsonObject json = new JsonObject();
        json.addProperty("latitude", f0.getLatitude().toString());
        json.addProperty("longitude", f0.getLongitude().toString());
        json.addProperty("latitude", f1.getLatitude().toString());
        json.addProperty("longitude", f1.getLongitude().toString());
        return "";
    }
}
