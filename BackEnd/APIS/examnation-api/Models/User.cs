using System;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; }
    public string Username { get; set; }
    public string First_Name { get; set; }
    public string Last_Name { get; set; }
    public string Password_Hash { get; set; }
    public string Role { get; set; }
    public DateTime Created_At { get; set; }
}