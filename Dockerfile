FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ./Estoque.Server/Estoque.Server.csproj ./Estoque.Server/
RUN dotnet restore ./Estoque.Server/Estoque.Server.csproj

COPY . .

WORKDIR /src/Estoque.Server

RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV zenite_jwt_auth=""

EXPOSE 8080

ENTRYPOINT ["dotnet", "Estoque.Server.dll"]
