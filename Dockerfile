FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY global.json ./
COPY backend/VocabMate.Api/VocabMate.Api.csproj backend/VocabMate.Api/
COPY backend/VocabMate.Tests/VocabMate.Tests.csproj backend/VocabMate.Tests/
COPY backend/VocabMate.sln backend/
RUN dotnet restore backend/VocabMate.sln
COPY backend/ backend/
RUN dotnet test backend/VocabMate.sln --configuration Release --no-restore
RUN dotnet publish backend/VocabMate.Api --configuration Release --no-restore --output /out /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production
COPY --from=build /out ./
USER app
EXPOSE 8080
ENTRYPOINT ["sh", "/app/start.sh"]
