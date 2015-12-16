package DynamicFlink;
import DynamicFlink.s1POJO1446417861336;
import org.apache.flink.api.common.functions.FilterFunction;
import java.lang.reflect.Field;
import java.util.ArrayList;
import org.apache.commons.jexl2.JexlContext;
import org.apache.commons.jexl2.JexlEngine;
import org.apache.commons.jexl2.MapContext;
import com.google.gson.JsonObject;
public class GenericFilter1446417861336 implements FilterFunction<s1POJO1446417861336> {
private static String toEval;
private static ArrayList<JsonObject> conditions;
private static String logicOP;
private static JexlContext jctx;
public GenericFilter1446417861336(ArrayList<JsonObject> p_conditions, String p_logicOP){
	conditions = p_conditions;
	logicOP = p_logicOP;
}
private String composeFilterConditions(s1POJO1446417861336 obj) throws NoSuchFieldException, SecurityException{
	String field;
	String value = null;
	String value1 = null;
	String value2 = null;
	String operator;
	String type;
	int count = 0;
	toEval = "";
	jctx = new MapContext();
	Class<?> c = obj.getClass();
	for(JsonObject jsonOBJ : conditions){
		field = jsonOBJ.get("attribute").getAsString();
		operator = jsonOBJ.get("operator").getAsString();
		type = jsonOBJ.get("type").getAsString();
		if(jsonOBJ.has("value")){
			value = jsonOBJ.get("value").getAsString();
		}
		else if(jsonOBJ.has("value1") && jsonOBJ.has("value2")){
			value1 = jsonOBJ.get("value1").getAsString();
			value2 = jsonOBJ.get("value2").getAsString();
		}
		// Settaggi
		Field f = c.getDeclaredField(field);
		String fieldName = f.getName();
		f.setAccessible(true);
		// Appendo l'operatore al termine dell'espressione
		if(count>0){
			toEval += " " + logicOP + " ";
		}
		if(type.equals("string")){ // se type ? string
			if(operator.equals("=")){
				toEval += "obj.get" + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1) + "()";
				toEval += ".equals(" + value + ")";
				// Creo il context e setto gli oggetti coinvolti nell'espressione
				//jctx.set("value", value);
			}
			else if(operator.equals("LIKE")){
				toEval += toEval += "obj.get" + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1) + "()";
				toEval += ".matches(\"(.*)\" + value + \"(.*)\")";
			}
			else if(operator.equals("NOT LIKE")){
				toEval += toEval += "!obj.get" + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1) + "()";
				toEval += ".matches(\"(.*)\" + value + \"(.*)\")";
			}
			else if(operator.equals("RANGE")){
			}
			else if(operator.equals("NOT RANGE")){
			}
			jctx.set("obj", obj);
		}
		else if(type.equals("numeric")){
			toEval += "obj.get" + field.substring(0, 1).toUpperCase() + field.substring(1) + "() ";
			if(operator.equals("=")){
				toEval += String.format("== %f", Double.parseDouble(value));
			}
			else if(operator.equals("RANGE")){
				toEval += String.format(">= %f", Double.parseDouble(value1));
				toEval += " " + logicOP + " obj.get" + field.substring(0, 1).toUpperCase() + field.substring(1) + "() ";
				toEval += String.format("<= %f", Double.parseDouble(value2));
			}
			else if(operator.equals("NOT RANGE")){
				toEval += String.format("<= %f", Double.parseDouble(value1));
				toEval += " " + logicOP + " obj.get" + field.substring(0, 1).toUpperCase() + field.substring(1) + "() ";
				toEval += String.format(">= %f", Double.parseDouble(value2));
			}
			else {
				toEval += String.format(operator + " %f", Double.parseDouble(value));
			}
			jctx.set("obj", obj);
		}
		count+=1;
	}
	return toEval;
}
@Override
public boolean filter(s1POJO1446417861336 obj) {
    try{
	     JexlEngine jexl = new JexlEngine();
        toEval = this.composeFilterConditions(obj);
        // Creo l'oggetto espressione
        org.apache.commons.jexl2.Expression e = jexl.createExpression( toEval );
        // Valuto l'espressione
        Object o = e.evaluate(jctx);
        if((boolean) o){
            return true;
        }
    } catch(Exception e1){
        return false;
    }
    return false;
}
}