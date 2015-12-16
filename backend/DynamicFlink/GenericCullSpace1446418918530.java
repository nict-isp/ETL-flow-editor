package DynamicFlink;
import DynamicFlink.s1POJO1446418918530;
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.util.Collector;
public class GenericCullSpace1446418918530 implements FlatMapFunction<s1POJO1446418918530,s1POJO1446418918530> {
    protected int numerator;
    protected int denominator;
    protected String lat_data_name;
    protected String lon_data_name;
    protected Double lat_interval;
    protected Double long_interval;
    protected Double west;
    protected Double south;
    protected Double east;
    protected Double north;
    public GenericCullSpace1446418918530(int p_num, int p_den, String lat_dn, String lon_dn, Double lat_in, Double long_in, Double p_north, Double p_south, Double p_east, Double p_west){
        this.numerator = p_num;
        this.denominator = p_den;
        this.lat_data_name = lat_dn;
        this.lon_data_name = lon_dn;
        this.lat_interval = lat_in;
        this.long_interval = long_in;
        this.west = p_west;
        this.south = p_south;
        this.north = p_north;
        this.east = p_east;
    }
    public int getNumerator() {
        return numerator;
}
    public void setNumerator(int numerator) {
        this.numerator = numerator;
}
    public int getDenominator() {
        return denominator;
}
    public void setDenominator(int denominator) {
        this.denominator = denominator;
}
    public String getLat_data_name() {
        return lat_data_name;
}
    public void setLat_data_name(String lat_data_name) {
        this.lat_data_name = lat_data_name;
}
    public String getLon_data_name() {
        return lon_data_name;
}
    public void setLon_data_name(String lon_data_name) {
        this.lon_data_name = lon_data_name;
}
    public Double getLat_interval() {
        return lat_interval;
}
    public void setLat_interval(Double lat_interval) {
        this.lat_interval = lat_interval;
}
    public Double getLong_interval() {
        return long_interval;
}
    public void setLong_interval(Double long_interval) {
        this.long_interval = long_interval;
}
    public Double getWest() {
return west;
}
    public void setWest(Double west) {
        this.west = west;
}
    public Double getSouth() {
       return south;
}
    public void setSouth(Double south) {
        this.south = south;
}
    public Double getEast() {
        return east;
}
    public void setEast(Double east) {
this.east = east;
}
    public Double getNorth() {
        return north;
}
    public void setNorth(Double north) {
        this.north = north;
}
    @Override    public void flatMap(s1POJO1446418918530 obj, Collector<s1POJO1446418918530> coll){
        double latitude;
        double longitude;
        try{
            latitude = Double.parseDouble(obj.getLatitude());
            longitude = Double.parseDouble(obj.getLongitude());
            if(longitude >= this.west && longitude <= this.east && latitude >= this.south && latitude <= this.north){
                 coll.collect(obj);
            }
        } catch(Exception e){
            e.printStackTrace();
            System.out.print(obj.getLatitude());
        }
    }
}