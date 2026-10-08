from django.db import models

class Building(models.Model):
    name = models.CharField(max_length=200)
    building_id = models.PositiveIntegerField()
    device_code = models.CharField(max_length=30)

class MeterData(models.Model):
    measurement_date = models.DateTimeField()
    device_code = models.CharField(max_length=30)
    recieved_date = models.DateTimeField()
    P = models.FloatField()
    Q = models.FloatField()
    S = models.FloatField()
    Ea_Exp_Interval = models.FloatField()
    Ea_Imp_Interval = models.FloatField()
    Er_Exp_Interval = models.FloatField()
    Er_Imp_Interval = models.FloatField()
    Es_Exp_Interval = models.FloatField()
    Es_Imp_Interval = models.FloatField()
    nem12QualityCode = models.CharField(max_length=1)


class Users(models.Model):
    user_id = models.IntegerField(primary_key=True)
    access_level = models.CharField(max_length=50)
    password = models.CharField(max_length=128)

class Weather(models.Model):
    temperature = models.FloatField()
    humidity = models.IntegerField()
    time = models.DateTimeField()

